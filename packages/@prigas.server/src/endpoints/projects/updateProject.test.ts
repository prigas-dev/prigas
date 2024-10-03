import { ProjectConfig } from "@prigas/server.api"
import { services } from "../../lib/services.js"
import {
  updateProjectHandler,
  UpdateProjectHandlerInput,
} from "./updateProject.js"

describe("updateProject", function () {
  beforeEach(async function () {
    await services.projectConfigRepository.saveProjectConfig({
      name: "Project Name",
      root: ".",
      commands: {
        run: "",
      },
    })
  })
  it("should work with valid input", async function () {
    const input: UpdateProjectHandlerInput = {
      projectName: "Project Name",
      projectConfig: {
        name: "Project Name",
        root: ".",
        commands: {
          run: "",
        },
      },
    }
    const [output, err] = await updateProjectHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })

  it("should overwrite existing project config with the same name", async function () {
    const input: UpdateProjectHandlerInput = {
      projectName: "Project Name",
      projectConfig: {
        name: "Project Name",
        root: "./new-root",
        commands: {
          run: "dotnet run",
        },
      },
    }
    const [_, err] = await updateProjectHandler(input)
    expect(err).toBeUndefined()

    const [projectConfig, __] =
      await services.projectConfigRepository.loadProjectConfig("Project Name")

    expect(projectConfig).toEqual<ProjectConfig>({
      name: "Project Name",
      root: "./new-root",
      commands: {
        run: "dotnet run",
      },
    })
  })

  it("should return NotFoundError when project config does not exist", async function () {
    const input: UpdateProjectHandlerInput = {
      projectName: "Other Project", // Other Project does not exist
      projectConfig: {
        name: "Other Project",
        root: "./new-root",
        commands: {
          run: "dotnet run",
        },
      },
    }
    const [_, err] = await updateProjectHandler(input)
    expect(err?.type).toEqual("NotFoundError")
  })

  it("should return ValidationError when trying to overwrite other project with same name", async function () {
    await services.projectConfigRepository.saveProjectConfig({
      name: "Other Project",
      root: ".",
      commands: {
        run: "",
      },
    })

    const input: UpdateProjectHandlerInput = {
      projectName: "Other Project",
      projectConfig: {
        name: "Project Name", // Tries to overwrite existing Project Name
        root: "./new-root",
        commands: {
          run: "dotnet run",
        },
      },
    }
    const [_, err] = await updateProjectHandler(input)
    expect(err?.type).toEqual("ValidationError")
  })

  it("should delete old and create new project config when name is changed", async function () {
    const input: UpdateProjectHandlerInput = {
      projectName: "Project Name",
      projectConfig: {
        name: "New Project Name",
        root: "./new-root",
        commands: {
          run: "dotnet run",
        },
      },
    }
    const [_, err] = await updateProjectHandler(input)
    expect(err).toBeUndefined()

    const [__, errLoadOld] =
      await services.projectConfigRepository.loadProjectConfig("Project Name")
    const [newProjectConfig, ___] =
      await services.projectConfigRepository.loadProjectConfig(
        "New Project Name",
      )

    expect(errLoadOld?.type).toEqual("NotFoundError")
    expect(newProjectConfig).toEqual<ProjectConfig>({
      name: "New Project Name",
      root: "./new-root",
      commands: {
        run: "dotnet run",
      },
    })
  })
})
