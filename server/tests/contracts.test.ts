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

test('catalogue pages render through Nuxt', async () => {
  assert.equal((await fetch(`${shop}/catalog`)).status, 200)
  const page = await getJson<{ items: { id: string }[] }>(`${shop}/api/catalog/products`)
  if (page.items[0]) assert.equal((await fetch(`${shop}/product/${encodeURIComponent(page.items[0].id)}`)).status, 200)
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
  assert.ok(openapi.paths['/api/catalog/products']?.get)
  assert.ok(openapi.paths['/api/catalog/products/{id}']?.get)
})

test('Express categories match the existing shop contract', async () => {
  const [current, migrated] = await Promise.all([
    getJson(`${shop}/api/catalog/categories`),
    getJson(`${api}/api/catalog/categories`),
  ])
  assert.deepEqual(migrated, current)
})

test('catalogue proxy preserves Express responses, filters and errors', async () => {
  const queries = [
    '', '?page=2', '?sort=price-asc', '?sort=price-desc', '?category=women-jeans&stock=1',
    '?size=42&size=44', '?shade=Индиго', '?q=джинсы', '?fit=free', '?sale=1',
    '?minPrice=1000&maxPrice=9000', '?page=0', '?sort=bad', '?minPrice=20&maxPrice=10',
  ]
  for (const query of queries) {
    const [oldResponse, newResponse] = await Promise.all([
      fetch(`${shop}/api/catalog/products${query}`),
      fetch(`${api}/api/catalog/products${query}`),
    ])
    assert.equal(newResponse.status, oldResponse.status, `status differs for ${query}`)
    assert.deepEqual(await newResponse.json(), await oldResponse.json(), `response differs for ${query}`)
  }
  const page = await getJson<{ items: { id: string }[] }>(`${shop}/api/catalog/products`)
  const first = page.items[0]
  if (first) {
    assert.deepEqual(
      await getJson(`${api}/api/catalog/products/${encodeURIComponent(first.id)}`),
      await getJson(`${shop}/api/catalog/products/${encodeURIComponent(first.id)}`),
    )
  }
  const [oldMissing, newMissing] = await Promise.all([
    fetch(`${shop}/api/catalog/products/not-a-real-product`),
    fetch(`${api}/api/catalog/products/not-a-real-product`),
  ])
  assert.equal(newMissing.status, oldMissing.status)
  const missingBody = await newMissing.json() as { code: string }
  assert.equal(newMissing.status, 404)
  assert.equal(missingBody.code, 'PRODUCT_NOT_FOUND')
  assert.deepEqual(missingBody, await oldMissing.json())
  const invalidPage = await getJson<{ code: string }>(`${shop}/api/catalog/products?page=0`, 400)
  assert.equal(invalidPage.code, 'CATALOG_INVALID_PAGE')
  const sorted = await getJson<{ items: { price: number }[] }>(`${shop}/api/catalog/products?sort=price-asc`)
  assert.ok(sorted.items.every((item, index) => index === 0 || item.price >= sorted.items[index - 1]!.price))
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
