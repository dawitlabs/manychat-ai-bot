// @ts-check
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore build artifacts and plain-JS migration/seed scripts
  { ignores: ['dist/**', 'drizzle/**', 'migrate.mjs', 'seed.mjs'] },

  // TypeScript-aware rules for all source files (including *.test.ts)
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      parserOptions: {
        // Use tsconfig.lint.json which includes test files (tsconfig.json excludes them)
        project: './tsconfig.lint.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Allow `void expr` for intentional fire-and-forget calls (used throughout)
      '@typescript-eslint/no-floating-promises': ['error', { ignoreVoid: true }],

      // Express type augmentation requires `declare global { namespace Express { ... } }`
      // This is the canonical TypeScript pattern — not a real namespace smell.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],

      // Honour the `_`-prefix convention for intentionally unused params / destructured vars
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Downgrade `any` to warning — the codebase uses it in a few justified error-handling spots
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },

  // Test files — different rules apply:
  //  1. `describe()` / `it()` from `node:test` return Promise<void> but are intentionally
  //     fire-and-forget (that is how Node's test runner works).
  //  2. Some tests use `require()` to defer a module import until after env vars are set,
  //     working around ESM's hoisted-import semantics. This is a legitimate pattern here.
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
