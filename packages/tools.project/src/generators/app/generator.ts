import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  Tree,
} from "@nx/devkit"
import * as path from "path"
import YAML from "yaml"
import { AppGeneratorOptions } from "./schema"

export async function appGenerator(tree: Tree, options: AppGeneratorOptions) {
  const packageName = `@prigas/${options.name}`
  const projectFolderName = packageName.replace("/", ".")
  const projectRoot = `packages/${projectFolderName}`

  generateFiles(tree, path.join(__dirname, "files"), projectRoot, {
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

  installPackagesTask(tree, true)
}

export default appGenerator
