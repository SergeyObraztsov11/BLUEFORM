export default defineNuxtPlugin(() => {
  for (const name of ['blueform-demo-cart', 'blueform-demo-favorites']) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
});
