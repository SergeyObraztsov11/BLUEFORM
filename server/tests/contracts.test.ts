import { test } from 'node:test'
import assert from 'node:assert/strict'

const shop = process.env.BLUEFORM_SHOP_URL ?? 'http://127.0.0.1:3000'
const api = process.env.BLUEFORM_API_URL ?? 'http://127.0.0.1:3001'

async function getJson<T>(url: string, status = 200): Promise<T> {
  const response = await fetch(url)
  assert.equal(response.status, status, `${url}: unexpected HTTP status`)
  return response.json() as Promise<T>
}

test('current shop exposes anonymous session and catalogue contracts', async () => {
  const [account, cart, favorites, categories, products] = await Promise.all([
    getJson<{ user: unknown }>(`${shop}/api/account`),
    getJson<{ items: unknown[] }>(`${shop}/api/cart`),
    getJson<{ items: unknown[] }>(`${shop}/api/favorites`),
    getJson<{ items: unknown[] }>(`${shop}/api/catalog/categories`),
    getJson<{ items: unknown[], total: number, page: number, pageSize: number }>(`${shop}/api/catalog/products`),
  ])
  assert.equal(account.user, null)
  assert.deepEqual(cart.items, [])
  assert.deepEqual(favorites.items, [])
  assert.ok(Array.isArray(categories.items))
  assert.ok(Array.isArray(products.items))
  assert.equal(typeof products.total, 'number')
  assert.equal(typeof products.page, 'number')
  assert.equal(typeof products.pageSize, 'number')
})

test('current shop rejects anonymous order access and invalid catalogue input', async () => {
  const [orders, order, invalidPage] = await Promise.all([
    getJson<{ code: string }>(`${shop}/api/orders`, 401),
    getJson<{ code: string }>(`${shop}/api/orders/not-real`, 401),
    getJson<{ code: string }>(`${shop}/api/catalog/products?page=0`, 400),
  ])
  assert.equal(orders.code, 'SESSION_REQUIRED')
  assert.equal(order.code, 'SESSION_REQUIRED')
  assert.equal(invalidPage.code, 'CATALOG_INVALID_PAGE')
})

test('checkout prompts a guest to sign in', async () => {
  const response = await fetch(`${shop}/checkout`)
  assert.equal(response.status, 200)
  assert.match(await response.text(), /Чтобы оформить заказ, войдите или зарегистрируйтесь/)
})

test('Express is available, connected to the database and documents its routes', async () => {
  const [health, ready, openapi] = await Promise.all([
    getJson<{ status: string }>(`${api}/api/health`),
    getJson<{ status: string }>(`${api}/api/ready`),
    getJson<{ paths: Record<string, { get?: unknown }> }>(`${api}/openapi.json`),
  ])
  assert.equal(health.status, 'ok')
  assert.equal(ready.status, 'ready')
  assert.ok(openapi.paths['/api/health']?.get)
  assert.ok(openapi.paths['/api/ready']?.get)
  assert.ok(openapi.paths['/api/catalog/categories']?.get)
})

test('Express categories match the existing shop contract', async () => {
  const [current, migrated] = await Promise.all([
    getJson(`${shop}/api/catalog/categories`),
    getJson(`${api}/api/catalog/categories`),
  ])
  assert.deepEqual(migrated, current)
})

test('Express returns a safe JSON error for malformed request bodies', async () => {
  const response = await fetch(`${api}/api/health`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  })
  const body = await response.json() as { code: string }
  assert.equal(response.status, 400)
  assert.equal(body.code, 'INVALID_JSON')
})
