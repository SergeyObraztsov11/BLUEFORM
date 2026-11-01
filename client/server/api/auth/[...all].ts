export default defineEventHandler((event) => {
  const { apiInternalUrl } = useRuntimeConfig(event);
  const requestUrl = getRequestURL(event);
  const target = new URL(requestUrl.pathname + requestUrl.search, apiInternalUrl);
  return proxyRequest(event, target.toString());
});
