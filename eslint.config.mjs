import eslint from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginJest from 'eslint-plugin-jest';
import tseslint from 'typescript-eslint';

const jsConfig = {
  files: ['**/*.{js,mjs,ts}'],
  ...eslint.configs.recommended,
  ...eslintConfigPrettier,
  plugins: {
    functional: eslintPluginFunctional,
  },
  rules: {
    // Functional style rules
    'functional/functional-parameters': ['error', { allowRestParameter: true, enforceParameterCount: false }],
    'functional/no-expression-statement': 'off',
    'functional/prefer-readonly-type': 'error',
    'functional/immutable-data': 'error',
    // Prefer arrow functions
    'prefer-arrow-callback': 'error',
    'arrow-body-style': ['error', 'as-needed'],
    // Enforce single object argument
    'max-params': ['error', 1],
    // style
    curly: ['error', 'all'],
  },
};

const tsConfig = tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.json', './tsconfig.test.json'],
    },
  },
  // Disabled due to too many false positives
  // ...eslintPluginFunctional.configs.recommended,
  // Disabled due to conflict with Prettier's style
  // ...eslintPluginFunctional.configs.stylistic,
  extends: [...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
  rules: {
    // Allow unused variables if they start with _
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
  },
});

const testConfig = {
  files: ['**/*.test.ts', '**/__tests__/**/*.ts'],
  plugins: {
    jest: eslintPluginJest,
  },
  ...eslintPluginJest.configs['flat/recommended'],
  ...eslintPluginJest.configs['flat/style'],
  rules: {
    // Custom rule to disallow .only and .skip due to a dependency conflict in eslint-plugin-testing-library
    'no-restricted-properties': [
      'error',
      {
        object: 'describe',
        property: 'only',
        message: 'describe.only is not allowed. Remove .only to run all tests.',
      },
      {
        object: 'it',
        property: 'only',
        message: 'it.only is not allowed. Remove .only to run all tests.',
      },
      {
        object: 'test',
        property: 'only',
        message: 'test.only is not allowed. Remove .only to run all tests.',
      },
      {
        object: 'describe',
        property: 'skip',
        message: 'describe.skip is not allowed. Use xdescribe instead.',
      },
      {
        object: 'it',
        property: 'skip',
        message: 'it.skip is not allowed. Use xit instead.',
      },
      {
        object: 'test',
        property: 'skip',
        message: 'test.skip is not allowed. Use xtest instead.',
      },
    ],
  },
};

export default [jsConfig, ...tsConfig, testConfig];
