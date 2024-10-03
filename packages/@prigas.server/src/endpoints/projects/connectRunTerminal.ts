import { ProjectConfigSchema } from "@prigas/server.api"
import { Err, Ok } from "libs.result"
import type { WebSocket } from "ws"
import { z } from "zod"
import { services } from "../../lib/services.js"

export const RunProjectInputSchema = z.object({
  projectName: ProjectConfigSchema.shape.name,
})
type RunProjectHandlerInput = z.output<typeof RunProjectInputSchema>

export async function connectRunTerminal(
  input: RunProjectHandlerInput,
  socket: WebSocket,
) {
  const { projectRunner, projectConfigRepository } = services

  const [projectConfig, errLoad] =
    await projectConfigRepository.loadProjectConfig(input.projectName)
  if (errLoad != null) {
    return Err(errLoad)
  }

  projectRunner.connect(projectConfig.name, socket)

  return Ok()
}
