import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // Componentes vendored (shadcn/ui): exportam helpers de variante
    // (buttonVariants etc.) junto aos componentes por decisão de design da
    // biblioteca. A regra de fast-refresh não se aplica a esses arquivos.
    files: ['src/components/ui/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
