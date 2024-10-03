import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, NotFoundErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const StopProjectInputSchema = z.object({
  projectName: ProjectConfigSchema.shape.name,
})
export type StopProjectInput = z.input<typeof StopProjectInputSchema>

export const StopProjectOutputSchema = result(
  z.object({}),
  DefaultErrorSchema.or(NotFoundErrorSchema),
)
export type StopProjectOutput = z.output<typeof StopProjectOutputSchema>

export const stopProject = c.mutation({
  method: "POST",
  path: "/projects/stopProject",
  body: StopProjectInputSchema,
  responses: {
    200: StopProjectOutputSchema,
  },
})
