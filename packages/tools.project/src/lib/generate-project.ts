import { formatFiles, generateFiles, Tree } from "@nx/devkit"
import { execSync } from "node:child_process"
import YAML from "yaml"

export interface GenerateProjectOptions {
  tree: Tree
  name: string
  templateFolder: string
}

export async function generateProject(options: GenerateProjectOptions) {
  const packageName = `@prigas/${options.name}`
  const projectFolderName = packageName.replace("/", ".")
  const projectRoot = `packages/${projectFolderName}`

  const tree = options.tree
  generateFiles(tree, options.templateFolder, projectRoot, {
    name: options.name,
    projectFolderName: projectFolderName,
    projectRoot: projectRoot,
    packageName: packageName,
  })

  const pnpmWorkspaceStr = tree.read("pnpm-workspace.yaml", "utf-8")
  if (pnpmWorkspaceStr == null) {
    throw new Error("Expected pnpm-workspace.yaml file to exist")
  }
  const pnpmWorkspaceYaml = YAML.parse(pnpmWorkspaceStr) as {
    packages: string[]
  }
  pnpmWorkspaceYaml.packages.push(projectRoot)
  pnpmWorkspaceYaml.packages.sort((a, b) => a.localeCompare(b))
  const updatedPnpmWorkspaceStr = YAML.stringify(pnpmWorkspaceYaml)
  tree.write("pnpm-workspace.yaml", updatedPnpmWorkspaceStr)

  await formatFiles(tree)

  const output = execSync("pnpm install", { encoding: "utf-8" })
  console.log(output)
}
