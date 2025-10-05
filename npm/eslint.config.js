import importPlugin from 'eslint-plugin-import';
import eslintUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const baseConfig = [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  { languageOptions: { globals: globals.node } },
  ...tseslint.configs.recommended,
  {
    plugins: {
      import: importPlugin,
      'unused-imports': eslintUnusedImports,
    },
    rules: {
      '@typescript-eslint/naming-convention': [
        'warn',
        // Enforce UPPER_CASE for const variables (must come first)
        // {
        //   selector: ['variable'],
        //   modifiers: ['const'],
        //   format: ['UPPER_CASE'],
        // },
        // Enforce camelCase for variables and functions
        {
          selector: ['variable', 'function', 'parameter'],
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        // Enforce PascalCase for class and type-like identifiers
        {
          selector: ['typeLike'],
          format: ['PascalCase'],
        },
        // Allow any naming for object properties
        {
          selector: ['property'],
          format: null,
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/array-type': [
        'error',
        {
          default: 'array',
        },
      ],
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            ['parent', 'sibling'],
            'index',
            'object',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'linebreak-style': ['error', 'unix'], // For LF end of line rule - Unix style
      curly: ['error', 'all'],
      'unused-imports/no-unused-imports': 'error',
    },
  },
  {
    files: ['src/**/*.{js,mjs,cjs,ts}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportDeclaration[source.value=/\\.ts$/]',
          message:
            'Importing with file extension .ts in src files is not allowed. Use .js instead.',
        },
      ],
    },
  },
  { ignores: ['dist', 'node_modules'] },
];

// Export configuration
export default baseConfig;
