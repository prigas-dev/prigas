import { initContract, RouterOptions } from "@ts-rest/core"
import { addProject } from "./endpoints/projects/addProject.js"
import { getProject } from "./endpoints/projects/getProject.js"
import { listAllProjects } from "./endpoints/projects/listAllProjects.js"
import { runProject } from "./endpoints/projects/runProject.js"
import { updateProject } from "./endpoints/projects/updateProject.js"
import { stopProject } from "./endpoints/projects/stopProject.js"

const c = initContract()

const options = {
  pathPrefix: "/api",
  strictStatusCodes: true,
} as const satisfies RouterOptions

export const api = c.router(
  {
    projects: {
      addProject: addProject,
      listAllProjects: listAllProjects,
      getProject: getProject,
      updateProject: updateProject,
      runProject: runProject,
      stopProject: stopProject,
    },
  },
  options,
)
export * from "./domain.js"
export * from "./schemas.js"
