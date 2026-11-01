import { test } from 'node:test'
import assert from 'node:assert/strict'

const shop = process.env.BLUEFORM_SHOP_URL ?? 'http://127.0.0.1:3000'
const api = process.env.BLUEFORM_API_URL ?? 'http://127.0.0.1:3001'

async function getJson(url, status = 200) {
  const response = await fetch(url)
  assert.equal(response.status, status, `${url}: unexpected HTTP status`)
  return response.json()
}

test('current shop exposes anonymous session and catalogue contracts', async () => {
  const [account, cart, favorites, categories, products] = await Promise.all([
    getJson(`${shop}/api/account`),
    getJson(`${shop}/api/cart`),
    getJson(`${shop}/api/favorites`),
    getJson(`${shop}/api/catalog/categories`),
    getJson(`${shop}/api/catalog/products`),
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

test('Express is available, connected to the database and documents its routes', async () => {
  const [health, ready, openapi] = await Promise.all([
    getJson(`${api}/api/health`),
    getJson(`${api}/api/ready`),
    getJson(`${api}/openapi.json`),
  ])
  assert.equal(health.status, 'ok')
  assert.equal(ready.status, 'ready')
  assert.ok(openapi.paths['/api/health'].get)
  assert.ok(openapi.paths['/api/ready'].get)
})
