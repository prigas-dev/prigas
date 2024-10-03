import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const AddProjectInputSchema = z.object({
  projectConfig: ProjectConfigSchema.pick({
    name: true,
    root: true,
  }),
})
export type AddProjectInput = z.input<typeof AddProjectInputSchema>

export const AddProjectOutputSchema = result(z.object({}), DefaultErrorSchema)
export type AddProjectOutput = z.output<typeof AddProjectOutputSchema>

export const addProject = c.mutation({
  method: "POST",
  path: "/projects/addProject",
  body: AddProjectInputSchema,
  responses: {
    200: AddProjectOutputSchema,
  },
})
