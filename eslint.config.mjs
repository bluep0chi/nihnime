import js from "@eslint/js";
import globals from "globals";
export default [
  { ignores: [".next/**", "node_modules/**", "out/**"] },
  js.configs.recommended,
  { files: ["**/*.{js,jsx,mjs}"], languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } }, globals: { ...globals.browser, ...globals.node } }, rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z]|^_", argsIgnorePattern: "^_", caughtErrors: "none" }] } },
];
