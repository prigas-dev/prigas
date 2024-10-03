import js from "@eslint/js"
import react from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import globals from "globals"
import { readdirSync } from "node:fs"
import { readFile } from "node:fs/promises"
import { join } from "node:path/posix"
import tseslint from "typescript-eslint"
import YAML from "yaml"

const pnpmWorkspaceYaml = await readFile("pnpm-workspace.yaml", {
  encoding: "utf-8",
})
const pnpmWorkspace = YAML.parse(pnpmWorkspaceYaml)
const projectFolders = pnpmWorkspace.packages
const tsProjects = projectFolders.flatMap((projectFolderGlob) => {
  const projectFiles = readdirSync(projectFolderGlob)
  const tsconfigs = projectFiles
    .filter(
      (file) =>
        file.includes("tsconfig") &&
        file.endsWith(".json") &&
        file !== "tsconfig.json",
    )
    .map((file) => join(projectFolderGlob, file))
  return tsconfigs
})

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: tsProjects,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-misused-promises": [
        "error",
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      "@typescript-eslint/prefer-nullish-coalescing": [
        "error",
        {
          ignorePrimitives: {
            string: true,
          },
        },
      ],
    },
  },
)
