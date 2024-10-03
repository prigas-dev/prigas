import {
  StopProjectInputSchema,
  StopProjectOutputSchema,
  api,
} from "@prigas/server.api"
import { Err, Ok } from "libs.result"
import { z } from "zod"
import { logger } from "../../lib/logger.js"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

export type StopProjectHandlerInput = z.output<typeof StopProjectInputSchema>
export type StopProjectHandlerOutput = z.input<typeof StopProjectOutputSchema>
export async function stopProjectHandler(
  input: StopProjectHandlerInput,
): Promise<StopProjectHandlerOutput> {
  logger.info("stopProject", input)
  const { projectRunner, projectConfigRepository } = services

  const [projectConfig, errLoad] =
    await projectConfigRepository.loadProjectConfig(input.projectName)
  if (errLoad != null) {
    return Err(errLoad)
  }
  logger.debug("runProject - projectConfig loaded", {
    ...input,
    projectConfig,
  })

  const [_, errStop] = projectRunner.stop(projectConfig.name)
  if (errStop != null) {
    return Err(errStop)
  }

  return Ok({})
}

export const stopProject =
  routeHandler<typeof api.projects.stopProject>(stopProjectHandler)
