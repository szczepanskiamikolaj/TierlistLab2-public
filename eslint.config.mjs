import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import eslintConfigPrettier from "eslint-config-prettier";  // Config for Prettier

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      "prettier/prettier": "error",  // Enable Prettier as an ESLint rule
      "react/jsx-one-expression-per-line": "error",  // Enforce one-line JSX expressions
      "indent": ["error", "tab"],  // Enforce tabs for indentation
      "function-paren-newline": ["error", "multiline"],  // Line breaks for function parameters
      "max-len": ["error", { code: 100 }],  // Max line length (to encourage single-line function definitions)
    },
  },
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  eslintConfigPrettier  // Use Prettier's recommended config to avoid rule conflicts
];
