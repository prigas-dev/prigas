import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, NotFoundErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const GetProjectInputSchema = z.object({
  projectName: z.string(),
})
export type GetProjectInput = z.input<typeof GetProjectInputSchema>

export const GetProjectOutputSchema = result(
  z.object({
    projectConfig: ProjectConfigSchema,
  }),
  DefaultErrorSchema.or(NotFoundErrorSchema),
)
export type GetProjectOutput = z.output<typeof GetProjectOutputSchema>

export const getProject = c.query({
  method: "GET",
  path: "/projects/getProject",
  query: GetProjectInputSchema,
  responses: {
    200: GetProjectOutputSchema,
  },
})
