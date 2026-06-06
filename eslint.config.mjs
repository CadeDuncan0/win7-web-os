// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'
import cypressPlugin from 'eslint-plugin-cypress'
import importPlugin from 'eslint-plugin-import'
import storybook from 'eslint-plugin-storybook'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier, // Custom rules
  {
    plugins: {
      import: importPlugin,
    },

    rules: {
      // 1. Disallow console.log (allow warn + error if needed)
      'no-console': ['error'],
      curly: ['error', 'all'],
      eqeqeq: ['error', 'always'],

      // 2. Enforce consistent import ordering
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
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
          argsIgnorePattern: '^_', // allow intentional unused args
        },
      ],
    },
  },
  {
    files: [
      'src/components/**/Window/**/*.ts',
      'src/components/**/Window/**/*.tsx',
      'src/components/**/ManagedWindow/**/*.ts',
      'src/components/**/ManagedWindow/**/*.tsx',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@dnd-kit/*'],
              message:
                'Window dragging uses raw pointermove — @dnd-kit is for icon drag only (see CLAUDE.md).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['cypress/**/*.ts'],
    ...cypressPlugin.configs.recommended,
  }, // Override default ignores of eslint-config-next
  globalIgnores(['.next/**', 'out/**', 'build/**', 'storybook-static/**', 'next-env.d.ts']),
  ...storybook.configs['flat/recommended'],
])

export default eslintConfig
