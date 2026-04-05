import { globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import importPlugin from 'eslint-plugin-import'
import prettier from 'eslint-config-prettier'

export default [
  ...(Array.isArray(nextVitals) ? nextVitals : [nextVitals]),
  ...(Array.isArray(nextTs) ? nextTs : [nextTs]),
  prettier,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // 1. Disallow console.log (allow warn + error)
      'no-console': ['error', { allow: ['warn', 'error'] }],

      // 2. Enforce consistent import ordering
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // 3. Enforce no unused variables (TS-aware override)
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          vars: 'all',
          args: 'after-used',
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
        },
      ],
    },
  },

  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]
