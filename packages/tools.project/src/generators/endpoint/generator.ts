import { formatFiles, getProjects, Tree } from "@nx/devkit"
import assert from "node:assert"
import { generateApi } from "./generateApi"
import { generateServer } from "./generateServer"
import type { EndpointGeneratorOptions } from "./schema.d.ts"

export async function endpointGenerator(
  tree: Tree,
  options: EndpointGeneratorOptions,
) {
  const projects = getProjects(tree)
  const backendApi = projects.get("@prigas/server.api")
  const backendServer = projects.get("@prigas/server")
  assert(backendApi, "@prigas/server.api project was not found")
  assert(backendServer, "@prigas/server project was not found")

  generateApi(tree, backendApi.root, options)
  generateServer(tree, backendServer.root, options)

  await formatFiles(tree)
}

export default endpointGenerator
