import {
  AddProjectInputSchema,
  AddProjectOutputSchema,
  api,
  ProjectConfig,
} from "@prigas/server.api"
import { Err, Ok, UnexpectedError, ValidationError } from "libs.result"
import { z } from "zod"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

type AddProjectInput = z.output<typeof AddProjectInputSchema>
type AddProjectOutput = z.input<typeof AddProjectOutputSchema>
export async function addProjectHandler(
  input: AddProjectInput,
): Promise<AddProjectOutput> {
  const { projectConfig } = input
  const { projectConfigRepository } = services

  const [existingProjectConfig, errLoad] =
    await projectConfigRepository.loadProjectConfig(projectConfig.name)
  if (existingProjectConfig != null) {
    return ValidationError(
      `Project ${projectConfig.name} already exist. Please choose another name.`,
    )
  }

  if (errLoad.type !== "NotFoundError") {
    return Err(errLoad)
  }

  const newProjectConfig: ProjectConfig = {
    name: projectConfig.name,
    root: projectConfig.root,
    commands: {
      run: "",
    },
  }

  const [__, errSave] =
    await projectConfigRepository.saveProjectConfig(newProjectConfig)
  if (errSave != null) {
    return UnexpectedError(errSave.message, errSave)
  }

  return Ok({})
}

export const addProject =
  routeHandler<typeof api.projects.addProject>(addProjectHandler)
