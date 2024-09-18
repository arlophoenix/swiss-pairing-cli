import eslintConfigPrettier from 'eslint-config-prettier';
import eslintPluginFunctional from 'eslint-plugin-functional';
import eslintPluginJest from 'eslint-plugin-jest';
import globals from 'globals';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['**/*.{js,mjs,ts}'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      functional: eslintPluginFunctional,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.strict.rules,
      ...eslintConfigPrettier.rules,
      // Functional style rules
      'functional/functional-parameters': ['error', { allowRestParameter: true, enforceParameterCount: false }],
      'functional/no-expression-statement': 'off',
      // TODO: enable these rules to enforce a more functional style
      // "functional/immutable-data": "error",
      // "functional/no-let": "error",
      // "functional/prefer-readonly-type": "error",
      // Prefer arrow functions
      'prefer-arrow-callback': 'error',
      'arrow-body-style': ['error', 'as-needed'],
      // Enforce single object argument
      'max-params': ['error', 1],
      // whitespace formatting rules
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: '*' },
        { blankLine: 'any', prev: ['const', 'let', 'var'], next: ['const', 'let', 'var'] },
        { blankLine: 'always', prev: 'directive', next: '*' },
        { blankLine: 'always', prev: '*', next: 'function' },
      ],
      'lines-between-class-members': ['error', 'always'],
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'object-curly-newline': ['error', { multiline: true, consistent: true }],
      'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
    },
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.test.json'],
      },
    },
    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.strictTypeChecked.rules,
    },
  },
  {
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
  },
];
