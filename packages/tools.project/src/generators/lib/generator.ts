import { Tree } from "@nx/devkit"
import * as path from "path"
import { generateProject } from "../../lib/generate-project"
import { LibGeneratorOptions } from "./schema"

export async function libGenerator(tree: Tree, options: LibGeneratorOptions) {
  await generateProject({
    name: options.name,
    templateFolder: path.join(__dirname, "files"),
    tree: tree,
  })
}

export default libGenerator
