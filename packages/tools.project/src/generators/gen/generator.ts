import { Tree } from "@nx/devkit"
import { generatorGenerator } from "@nx/plugin/generators"
import { GenGeneratorSchema } from "./schema"

export async function genGenerator(tree: Tree, options: GenGeneratorSchema) {
  return generatorGenerator(tree, {
    name: options.name,
    directory: `packages/tools.project/src/generators/${options.name}`,
    description: options.description,
    unitTestRunner: "none",
    nameAndDirectoryFormat: "as-provided",
    skipFormat: false,
    skipLintChecks: false,
  })
}

export default genGenerator
