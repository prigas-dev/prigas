import { Tree } from "@nx/devkit"
import { executorGenerator } from "@nx/plugin/generators"
import { ExeGeneratorOptions } from "./schema"

export async function exeGenerator(tree: Tree, options: ExeGeneratorOptions) {
  return executorGenerator(tree, {
    name: options.name,
    directory: `packages/tools.project/src/executors/${options.name}`,
    description: options.description,
    unitTestRunner: "none",
    nameAndDirectoryFormat: "as-provided",
    skipFormat: false,
    skipLintChecks: false,
    includeHasher: false,
  })
}

export default exeGenerator
