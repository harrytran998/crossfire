import { defineConfig } from 'oxlint'

export default defineConfig({
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
    restriction: 'off',
    pedantic: 'off',
    style: 'off',
    nursery: 'off',
  },
  plugins: ['typescript', 'import', 'unicorn'],
  rules: {
    'no-unused-vars': 'error',
    'typescript/no-explicit-any': 'warn',
    'unicorn/prefer-node-protocol': 'error',
  },
  ignorePatterns: [
    'node_modules',
    'dist',
    'build',
    '.moon',
    '.claude',
    'coverage',
    '*.config.js',
    '*.config.ts',
    'scripts',
  ],
})
