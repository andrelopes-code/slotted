import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/.astro/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      'demos/nexora/angular/**',
      'pnpm-lock.yaml',
      /* Generated, untracked and large: the harness writes ~1 GB of pages. */
      'tools/harness/out/**',
      'tmp/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      // `const { omitted, ...rest } = options` is how a key is kept out of `rest`.
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
);
