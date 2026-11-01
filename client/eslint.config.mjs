import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt({
  rules: {
    // Oxfmt writes HTML void elements as self-closing in Vue templates.
    'vue/html-self-closing': ['error', { html: { void: 'always' } }],
  },
});
