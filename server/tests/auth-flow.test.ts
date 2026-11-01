import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { database } from '../src/database.js'

// Only run against the local Compose stack, never against deployed mail or a production URL.
test('registration, verification, session and logout survive the Nuxt proxy', { timeout: 60_000 }, async () => {
  assert.equal(process.env.BLUEFORM_ALLOW_AUTH_TEST, '1')
  assert.equal(process.env.SMTP_HOST, 'mailpit')
  assert.equal(process.env.BETTER_AUTH_URL, 'http://localhost:3000')
  assert.equal(new URL(process.env.DATABASE_URL ?? '').hostname, 'db')

  const email = `test-${randomUUID()}@example.test`
  const password = `Test-${randomUUID()}!`
  const shop = 'http://127.0.0.1:3000'
  const origin = 'http://localhost:3000'
  let messageId: string | undefined
  let disconnectLegacy: (() => Promise<void>) | undefined
  const prisma = database()

  const request = (path: string, body: object, cookie?: string) => fetch(`${shop}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin, host: 'localhost:3000', ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  })

  try {
    const untrusted = await fetch(`${shop}/api/auth/sign-in/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'http://untrusted.example', host: 'localhost:3000' },
      body: JSON.stringify({ email, password }),
    })
    assert.equal(untrusted.status, 403, 'cross-origin sign-in should be rejected')
    const signup = await request('/api/auth/sign-up/email', { name: 'Test', email, password })
    assert.equal(signup.status, 200, `registration should succeed: ${signup.ok ? '' : await signup.text()}`)

    let otp: string | undefined
    for (let attempt = 0; attempt < 20 && !otp; attempt++) {
      const messages = await (await fetch('http://mailpit:8025/api/v1/messages?limit=100')).json() as {
        messages: { ID: string, To: { Address: string }[] }[]
      }
      const message = messages.messages.find(item => item.To.some(recipient => recipient.Address === email))
      if (message) {
        messageId = message.ID
        const detail = await (await fetch(`http://mailpit:8025/api/v1/message/${message.ID}`)).json() as { Text: string }
        otp = detail.Text.match(/\b\d{5}\b/)?.[0]
      }
      if (!otp) await new Promise(resolve => setTimeout(resolve, 250))
    }
    assert.ok(otp, 'verification code should arrive in Mailpit')
    const verified = await request('/api/auth/email-otp/verify-email', { email, otp })
    assert.equal(verified.status, 200, 'verification should succeed')

    // Simulate a session issued by the still-present Nuxt Better Auth instance.
    const legacyModulePath = new URL('../../client/server/utils/auth.ts', import.meta.url).href
    const legacy = await import(legacyModulePath) as {
      auth: { api: { signInEmail: (options: { body: { email: string, password: string }, asResponse: true }) => Promise<Response> } }
    }
    const legacyPrismaPath = new URL('../../client/server/utils/prisma.ts', import.meta.url).href
    const legacyDb = await import(legacyPrismaPath) as { prisma: { $disconnect: () => Promise<void> } }
    disconnectLegacy = () => legacyDb.prisma.$disconnect()
    const legacySignin = await legacy.auth.api.signInEmail({ body: { email, password }, asResponse: true })
    assert.equal(legacySignin.status, 200, 'Nuxt should issue a session')
    const legacyCookie = legacySignin.headers.getSetCookie().map(value => value.split(';', 1)[0]).join('; ')
    assert.ok(legacyCookie, 'Nuxt session should have a cookie')
    const migratedSession = await fetch(`${shop}/api/auth/get-session`, { headers: { cookie: legacyCookie } })
    const migratedUser = await migratedSession.json() as { user?: { email: string } } | null
    assert.equal(migratedUser?.user?.email, email, 'Express should recognise an existing Nuxt session')

    // An explicit sign-in verifies password compatibility and cookie forwarding.
    const signin = await request('/api/auth/sign-in/email', { email, password })
    assert.equal(signin.status, 200, 'sign-in should succeed')
    const cookies = signin.headers.getSetCookie()
    assert.ok(cookies.length > 0, 'sign-in should forward session cookies')
    const cookie = cookies.map(value => value.split(';', 1)[0]).join('; ')
    const accountResponse = await fetch(`${shop}/api/account`, { headers: { cookie } })
    const account = await accountResponse.json() as { user: { email: string } | null }
    assert.equal(account.user?.email, email, 'existing Nuxt APIs should recognise the Express session')

    const signout = await request('/api/auth/sign-out', {}, cookie)
    assert.equal(signout.status, 200, 'sign-out should succeed')
    const after = await fetch(`${shop}/api/account`, { headers: { cookie } })
    assert.equal((await after.json() as { user: unknown }).user, null, 'session should be revoked')
  } finally {
    await prisma.user.deleteMany({ where: { email } })
    await prisma.verification.deleteMany({ where: { identifier: { contains: email } } })
    if (messageId) await fetch(`http://mailpit:8025/api/v1/message/${messageId}`, { method: 'DELETE' })
    if (disconnectLegacy) await disconnectLegacy()
    await prisma.$disconnect()
  }
})
