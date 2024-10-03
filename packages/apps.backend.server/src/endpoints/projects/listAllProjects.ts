import {
  ListAllProjectsInputSchema,
  ListAllProjectsOutputSchema,
  api,
} from "apps.backend.api"
import { Err, Ok, UnexpectedError } from "libs.result"
import { z } from "zod"
import { routeHandler } from "../../lib/route-handler.js"
import { services } from "../../lib/services.js"

type ListAllProjectsInput = z.output<typeof ListAllProjectsInputSchema>
type ListAllProjectsOutput = z.input<typeof ListAllProjectsOutputSchema>
export async function listAllProjectsHandler(
  _: ListAllProjectsInput,
): Promise<ListAllProjectsOutput> {
  const { projectConfigRepository } = services

  const [projectConfigs, err] =
    await projectConfigRepository.listAllProjectConfigs()
  if (err != null) {
    if (err.type === "DirReadError") {
      return UnexpectedError(err.message, err)
    }
    return Err(err)
  }
  return Ok({
    projectConfigs,
  })
}

export const listAllProjects = routeHandler<
  typeof api.projects.listAllProjects
>(listAllProjectsHandler)
