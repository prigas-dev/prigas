import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, NotFoundErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const RunProjectInputSchema = z.object({
  projectName: ProjectConfigSchema.shape.name,
})
export type RunProjectInput = z.input<typeof RunProjectInputSchema>

export const RunProjectOutputSchema = result(
  z.object({}),
  DefaultErrorSchema.or(NotFoundErrorSchema),
)
export type RunProjectOutput = z.output<typeof RunProjectOutputSchema>

export const runProject = c.mutation({
  method: "POST",
  path: "/projects/runProject",
  body: RunProjectInputSchema,
  responses: {
    200: RunProjectOutputSchema,
  },
})
