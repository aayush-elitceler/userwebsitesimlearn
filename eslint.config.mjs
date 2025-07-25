import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Extend next/core-web-vitals and next/typescript as before
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Override rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default eslintConfig;
