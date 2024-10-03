import {
  GetProjectInputSchema,
  GetProjectOutputSchema,
  api,
} from "apps.backend.api"
import { Err, Ok } from "libs.result"
import { z } from "zod"
import { logger } from "../../lib/logger.js"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

export type GetProjectHandlerInput = z.output<typeof GetProjectInputSchema>
export type GetProjectHandlerOutput = z.input<typeof GetProjectOutputSchema>
export async function getProjectHandler(
  input: GetProjectHandlerInput,
): Promise<GetProjectHandlerOutput> {
  logger.info("getProject", input)
  const { projectConfigRepository } = services

  const [projectConfig, err] = await projectConfigRepository.loadProjectConfig(
    input.projectName,
  )
  if (err != null) {
    return Err(err)
  }
  return Ok({
    projectConfig,
  })
}

export const getProject =
  routeHandler<typeof api.projects.getProject>(getProjectHandler)
