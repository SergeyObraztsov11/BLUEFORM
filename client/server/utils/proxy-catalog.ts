import type { H3Event } from 'h3';

export function proxyCatalog(event: H3Event) {
  const { apiInternalUrl } = useRuntimeConfig(event);
  const requestUrl = getRequestURL(event);
  return proxyRequest(event, new URL(requestUrl.pathname + requestUrl.search, apiInternalUrl).toString());
}
