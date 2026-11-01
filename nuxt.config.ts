import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    inlineDynamicImports: false,
    publicAssets: [
      { baseURL: '/swagger-ui', dir: 'node_modules/swagger-ui-dist', maxAge: 60 * 60 * 24 },
    ],
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['better-auth/vue', 'better-auth/client/plugins'],
    },
  },
})
