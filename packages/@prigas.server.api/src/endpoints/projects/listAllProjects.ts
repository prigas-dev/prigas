import { initContract } from "@ts-rest/core"
import { AggregateErrorSchema, DefaultErrorSchema, result } from "libs.result"
import { z } from "zod"
import { ProjectConfigSchema } from "../../domain.js"

const c = initContract()

export const ListAllProjectsInputSchema = z.object({})
export type ListAllProjectsInput = z.input<typeof ListAllProjectsInputSchema>

export const ListAllProjectsOutputSchema = result(
  z.object({
    projectConfigs: ProjectConfigSchema.array(),
  }),
  DefaultErrorSchema.or(AggregateErrorSchema),
)
export type ListAllProjectsOutput = z.output<typeof ListAllProjectsOutputSchema>

export const listAllProjects = c.query({
  method: "GET",
  path: "/projects/listAllProjects",
  query: ListAllProjectsInputSchema,
  responses: {
    200: ListAllProjectsOutputSchema,
  },
})
