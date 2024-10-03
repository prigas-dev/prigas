import { z } from "zod"

export const ProjectConfigSchema = z.object({
  /**
   * @type {string} - Root folder where the project lives
   */
  root: z.string().min(1),
  /**
   * @type {string} - How you want to identify the project in your local machine
   */
  name: z.string().min(1),
  commands: z
    .object({
      /**
       * @type {string} - Command to run the project. CWD is projectConfig.root
       */
      run: z.string().trim().default(""),
    })
    .default({}),
})
export type ProjectConfig = z.infer<typeof ProjectConfigSchema>
