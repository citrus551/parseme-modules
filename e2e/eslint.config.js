import importPlugin from 'eslint-plugin-import';
import eslintUnusedImports from 'eslint-plugin-unused-imports';
import globals from 'globals';

const baseConfig = [
  { files: ['**/*.{js,mjs,cjs}'] },
  { languageOptions: { globals: globals.node } },
  {
    plugins: {
      import: importPlugin,
      'unused-imports': eslintUnusedImports,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
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
      'linebreak-style': ['error', 'unix'],
      curly: ['error', 'all'],
      'unused-imports/no-unused-imports': 'error',
    },
  },
  { ignores: ['node_modules', 'repos'] },
];

export default baseConfig;
