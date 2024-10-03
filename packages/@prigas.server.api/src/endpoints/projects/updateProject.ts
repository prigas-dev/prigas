import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, NotFoundErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const UpdateProjectInputSchema = z.object({
  projectName: ProjectConfigSchema.shape.name,
  projectConfig: ProjectConfigSchema,
})
export type UpdateProjectInput = z.input<typeof UpdateProjectInputSchema>

export const UpdateProjectOutputSchema = result(
  z.object({}),
  DefaultErrorSchema.or(NotFoundErrorSchema),
)
export type UpdateProjectOutput = z.output<typeof UpdateProjectOutputSchema>

export const updateProject = c.mutation({
  method: "POST",
  path: "/projects/updateProject",
  body: UpdateProjectInputSchema,
  responses: {
    200: UpdateProjectOutputSchema,
  },
})
