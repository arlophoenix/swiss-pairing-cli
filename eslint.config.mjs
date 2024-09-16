import eslintConfigPrettier from "eslint-config-prettier";
import eslintPluginFunctional from "eslint-plugin-functional";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: { 
      globals: {
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      "functional": eslintPluginFunctional,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...tseslint.configs.strict.rules,
      ...eslintConfigPrettier.rules,
      // Functional style rules
      "functional/functional-parameters": ["error", { "allowRestParameter": true, "enforceParameterCount": false }],
      "functional/no-expression-statement": "off",
      // TODO: enable these rules to enforce a more functional style
      // "functional/immutable-data": "error",
      // "functional/no-let": "error",
      // "functional/prefer-readonly-type": "error",
      // Prefer arrow functions
      "prefer-arrow-callback": "error",
      "arrow-body-style": ["error", "as-needed"],
      // Enforce single object argument
      "max-params": ["error", 1],
    },
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.test.json"],
      },
    },
    rules: {
      ...tseslint.configs.recommendedTypeChecked.rules,
      ...tseslint.configs.strictTypeChecked.rules,
    },
  },
];
