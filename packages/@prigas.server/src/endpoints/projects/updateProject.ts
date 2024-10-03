import {
  UpdateProjectInputSchema,
  UpdateProjectOutputSchema,
  api,
} from "@prigas/server.api"
import { Err, Ok, UnexpectedError, ValidationError } from "libs.result"
import { z } from "zod"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

export type UpdateProjectHandlerInput = z.output<
  typeof UpdateProjectInputSchema
>
export type UpdateProjectHandlerOutput = z.input<
  typeof UpdateProjectOutputSchema
>
export async function updateProjectHandler(
  input: UpdateProjectHandlerInput,
): Promise<UpdateProjectHandlerOutput> {
  const { projectConfigRepository } = services

  const [_, errLoadOld] = await projectConfigRepository.loadProjectConfig(
    input.projectName,
  )
  if (errLoadOld != null) {
    return Err(errLoadOld)
  }

  if (input.projectName !== input.projectConfig.name) {
    // Checking if trying to overwrite an existing project

    const [_, errLoadExisting] =
      await projectConfigRepository.loadProjectConfig(input.projectConfig.name)

    if (errLoadExisting != null && errLoadExisting.type !== "NotFoundError") {
      return Err(errLoadExisting)
    }

    if (errLoadExisting == null) {
      return ValidationError(
        `Cannot overwrite existing project ${input.projectConfig.name}`,
        [
          {
            code: "custom",
            message: `Cannot overwrite existing project ${input.projectConfig.name}`,
            path: ["projectConfig", "name"],
          },
        ],
      )
    }

    // Deleting because now project is on input.projectConfig.name
    const [__, errDelete] = await projectConfigRepository.deleteProjectConfig(
      input.projectName,
    )
    if (errDelete != null) {
      return UnexpectedError(errDelete.message, errDelete)
    }
  }

  const [__, errSave] = await projectConfigRepository.saveProjectConfig(
    input.projectConfig,
  )
  if (errSave != null) {
    return UnexpectedError(errSave.message, errSave)
  }

  return Ok({})
}

export const updateProject =
  routeHandler<typeof api.projects.updateProject>(updateProjectHandler)
