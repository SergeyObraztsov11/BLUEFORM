import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/node_modules/**', '**/generated/**', '**/dist/**', '**/.nuxt/**', '**/.output/**'] },
  { files: ['server/**/*.ts', 'shared/**/*.ts', 'prisma/**/*.ts'], extends: [js.configs.recommended, ...tseslint.configs.recommended] },
  { files: ['server/**/*.ts', 'shared/**/*.ts', 'prisma/**/*.ts'], rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }] } },
)
