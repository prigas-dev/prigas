import {
  RunProjectInputSchema,
  RunProjectOutputSchema,
  api,
} from "@prigas/server.api"
import { Err, Ok, UnexpectedError, ValidationError } from "libs.result"
import { z } from "zod"
import { logger } from "../../lib/logger.js"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

export type RunProjectHandlerInput = z.output<typeof RunProjectInputSchema>
export type RunProjectHandlerOutput = z.input<typeof RunProjectOutputSchema>
export async function runProjectHandler(
  input: RunProjectHandlerInput,
): Promise<RunProjectHandlerOutput> {
  logger.info("runProject", input)
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

  if (!projectConfig.commands.run) {
    logger.warn("runProject - commands.run was empty")
    return ValidationError(
      `Project ${projectConfig.name} commands.run must not be empty.`,
    )
  }

  const [_, errRun] = await projectRunner.run(projectConfig)
  if (errRun != null) {
    if (errRun.type === "FileStatError") {
      return UnexpectedError(errRun.message, errRun)
    }
    return Err(errRun)
  }

  return Ok({})
}

export const runProject =
  routeHandler<typeof api.projects.runProject>(runProjectHandler)
