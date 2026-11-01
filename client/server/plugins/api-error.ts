export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error, { event }) => {
    const details = error as { data?: { code?: string }; statusCode?: number; message?: string };
    const code = details.data?.code;
    if (!event || !code || event.handled) return;
    const statusCode = details.statusCode || 500;
    const message = details.message || 'Не получилось выполнить запрос.';
    console.warn(JSON.stringify({ source: 'shop', code, statusCode, path: event.path, message }));
    setResponseStatus(event, statusCode);
    setResponseHeader(event, 'content-type', 'application/json; charset=utf-8');
    event.node.res.end(JSON.stringify({ error: true, code, statusCode, message }));
  });
});
