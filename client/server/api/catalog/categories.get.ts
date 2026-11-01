export default defineEventHandler((event) => {
  const { apiInternalUrl } = useRuntimeConfig(event)
  const target = new URL('/api/catalog/categories', apiInternalUrl)
  return proxyRequest(event, target.toString())
})
