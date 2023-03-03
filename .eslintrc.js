module.exports = {
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'universe/native',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  rules: {
    semi: [2, 'never'],
    quotes: [2, 'single'],
    'max-len': [2, { code: 120 }],
    '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
    '@typescript-eslint/ban-ts-comment': ['off'],
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        semi: false,
        printWidth: 120,
      },
    ],
  },
}
