import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const marker = 'node_modules/.blueform-lock-hash'
const digest = createHash('sha256').update(readFileSync('package-lock.json')).digest('hex')
if (!existsSync(marker) || readFileSync(marker, 'utf8').trim() !== digest) {
  const result = spawnSync('npm', ['ci'], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
  writeFileSync(marker, `${digest}\n`)
}
