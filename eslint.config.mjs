import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    /*
      The starter's `lint` script is a bare `eslint .`, which walks the
      generated .next output and reports ~14,700 errors in code nobody
      wrote. That makes the script useless, which makes it ignored, which
      is how a real error gets through. Ignore generated output so a
      non-empty lint result means something.
    */
    ignores: [".next/**", "node_modules/**", "out/**", "build/**", "next-env.d.ts"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
