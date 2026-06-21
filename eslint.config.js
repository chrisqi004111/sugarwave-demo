import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  // Server-side code (Vercel Functions + shared cores + Tencent Express) runs in
  // Node, not the browser — give it Node globals (process, Buffer, …) so they
  // aren't flagged as undefined.
  {
    files: ['api/**/*.js', 'lib/**/*.js', 'server/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
