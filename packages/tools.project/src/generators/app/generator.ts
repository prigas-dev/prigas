import { Tree } from "@nx/devkit"
import * as path from "path"
import { generateProject } from "../../lib/generate-project"
import { AppGeneratorOptions } from "./schema"

export async function appGenerator(tree: Tree, options: AppGeneratorOptions) {
  await generateProject({
    name: options.name,
    templateFolder: path.join(__dirname, "files"),
    tree: tree,
  })
}

export default appGenerator
