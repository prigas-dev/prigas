import cors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import fastifyWebsocket from "@fastify/websocket"
import { initServer } from "@ts-rest/fastify"
import { api } from "apps.backend.api"
import fastifyF from "fastify"
import { Err, ValidationError } from "libs.result"
import path from "node:path"
import { addProject } from "./endpoints/projects/addProject.js"
import {
  connectRunTerminal,
  RunProjectInputSchema,
} from "./endpoints/projects/connectRunTerminal.js"
import { getProject } from "./endpoints/projects/getProject.js"
import { listAllProjects } from "./endpoints/projects/listAllProjects.js"
import { runProject } from "./endpoints/projects/runProject.js"
import { stopProject } from "./endpoints/projects/stopProject.js"
import { updateProject } from "./endpoints/projects/updateProject.js"
import { env } from "./env.js"
import { jsonStringify } from "./lib/json.js"
import { logger } from "./lib/logger.js"

const fastify = fastifyF()
await fastify.register(cors)

await fastify.register(fastifyWebsocket)

const s = initServer()

const router = s.router(api, {
  projects: {
    addProject: addProject,
    listAllProjects: listAllProjects,
    getProject: getProject,
    updateProject: updateProject,
    runProject: runProject,
    stopProject: stopProject,
  },
})
await fastify.register(s.plugin(router))

await fastify.register(async (f) => {
  f.get(
    "/projects/connectRunTerminal",
    { websocket: true },
    async (socket, request) => {
      logger.info("Received request to connect run terminal")

      const parseQueryResult = RunProjectInputSchema.safeParse(request.query)
      if (!parseQueryResult.success) {
        logger.warn("Invalid query")
        socket.close(
          1002,
          jsonStringify(
            ValidationError(
              "Invalid parameters provided on query string",
              parseQueryResult.error.errors,
            ),
          ),
        )
        return
      }
      const input = parseQueryResult.data
      logger.info("Parsed query", input)
      const [_, errConnect] = await connectRunTerminal(input, socket)
      if (errConnect != null) {
        socket.close(1002, jsonStringify(Err(errConnect)))
        return
      }
    },
  )
})

await fastify.register(fastifyStatic, {
  root: path.join(import.meta.dirname, "..", "..", "apps.frontend"),
  prefix: "/",
  constraints: {}, // optional: default {}
})

export async function startPrigasServer() {
  await fastify.listen({ port: env.Port })
  logger.info(`Server running: http://localhost:${env.Port}`)
}
