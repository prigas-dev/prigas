import { ProjectConfig, ProjectConfigSchema } from "@prigas/server.api"
import {
  AggregateError,
  AppError,
  Err,
  NotFoundError,
  Ok,
  ValidationError,
} from "libs.result"
import path from "node:path"
import { FileManager } from "./file-manager.js"
import { jsonParse } from "./json.js"

export class WorkspaceDirectory {
  constructor(private readonly workspaceDir: string) {}

  path(...paths: Parameters<typeof path.join>) {
    return path.join(this.workspaceDir, ...paths)
  }
}

export class ProjectConfigRepository {
  constructor(
    private readonly wd: WorkspaceDirectory,
    private readonly fileManager: FileManager,
  ) {}

  async deleteProjectConfig(projectName: string) {
    const projectFolder = this.wd.path("projects", projectName)

    const [_, err] = await this.fileManager.rm(projectFolder)
    if (err != null) {
      return Err(err)
    }

    return Ok()
  }

  async loadProjectConfig(projectName: string) {
    const projectJsonPath = this.getProjectJsonPath(projectName)
    const projectConfigJson = await this.fileManager.readFile(projectJsonPath)
    if (projectConfigJson == null) {
      return NotFoundError(`Project ${projectName} not found`)
    }

    const [projectConfigObject, errJson] = jsonParse(projectConfigJson)
    if (errJson != null) {
      return ValidationError(
        `Invalid JSON project config at ${projectJsonPath}.`,
        undefined,
        errJson,
      )
    }

    const parseResult = ProjectConfigSchema.safeParse(projectConfigObject)
    if (!parseResult.success) {
      return ValidationError(
        `Invalid project config at ${projectJsonPath}.`,
        parseResult.error.errors,
      )
    }

    const projectConfig = parseResult.data
    return Ok(projectConfig)
  }

  async saveProjectConfig(projectConfig: ProjectConfig) {
    const projectJsonPath = this.getProjectJsonPath(projectConfig.name)

    const [_, errWrite] = await this.fileManager.writeFile(
      projectJsonPath,
      projectConfig,
    )
    if (errWrite != null) {
      return Err(errWrite)
    }

    return Ok()
  }

  async listAllProjectConfigs() {
    const projectsFolder = this.wd.path("projects")

    const [entries, errRead] = await this.fileManager.readdir(projectsFolder)
    if (errRead != null) {
      return Err(errRead)
    }

    const directories = entries.filter((entry) => entry.isDirectory())

    const projectConfigResults = await Promise.all(
      directories.map(async (directory) => {
        const projectName = directory.name

        const result = await this.loadProjectConfig(projectName)
        return result
      }),
    )

    const projectConfigs: ProjectConfig[] = []
    const errors: AppError[] = []
    for (const [projectConfig, err] of projectConfigResults) {
      if (err != null) {
        errors.push(err)
        continue
      }

      projectConfigs.push(projectConfig)
    }

    if (errors.length > 0) {
      return AggregateError("Failed to load some project configs.", errors)
    }

    return Ok(projectConfigs)
  }

  private getProjectJsonPath(projectName: string) {
    const projectJsonPath = this.wd.path(
      "projects",
      projectName,
      "project.prigas.json",
    )
    return projectJsonPath
  }
}
