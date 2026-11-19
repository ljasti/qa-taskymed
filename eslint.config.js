// File: eslint.config.js
// Purpose: Defines TypeScript lint rules for project source.
// Maintainer: Lakshmikiran J. | Project: TaskyMed QA-Practice
// Origin: Manually maintained; no generator command.
// Run: npm run lint. Edit manually when lint policy changes.
import tseslint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
export default [
  { ignores: ['node_modules/**', 'test-results/**', 'playwright-report/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: { parser },
    plugins: { '@typescript-eslint': tseslint },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
];
