import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist', 'node_modules'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettier,
  {
    languageOptions: {
      parserOptions: { project: './tsconfig.eslint.json' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/features/kanban/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['../canvas/**', '../../canvas/**', '**/features/canvas/**'],
              message:
                'Kanban must be isolated from canvas internals. Use shared API/auth infrastructure only.',
            },
          ],
        },
      ],
    },
  },
];
