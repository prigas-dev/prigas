import { env } from "../env.js"
import { FileManager } from "./file-manager.js"
import { ProjectRunner } from "./project-runner.js"
import { ProjectConfigRepository, WorkspaceDirectory } from "./repositories.js"

const wd = new WorkspaceDirectory(env.WorkspaceDirectory)
const fileManager = new FileManager()
const projectConfigRepository = new ProjectConfigRepository(wd, fileManager)
const projectRunner = new ProjectRunner(fileManager)

export const services = {
  fileManager,
  projectConfigRepository,
  projectRunner,
  wd,
}
