import path from "node:path"
import { getApiSchema } from "./node.js/api-schema.js"
import { generateServer } from "./node.js/generate-server.js"
import { getOperationHandlers } from "./node.js/handlers.js"

const projectRoot =
  "C:\\Users\\victo\\Dev\\prigas-dev\\prigas\\packages\\@prigas.sample"

const operationHandlers = getOperationHandlers({
  projectRoot: projectRoot,
})

await generateServer({
  projectRoot: projectRoot,
  serverPath: path.join(projectRoot, "src", "server.ts"),
})

const apiSchema = getApiSchema(operationHandlers)

console.log(apiSchema)
