import { ProjectConfig } from "apps.backend.api"
import { services } from "../../lib/services.js"
import { listAllProjectsHandler } from "./listAllProjects.js"

describe("listAllProjects", function () {
  it("should work with valid input", async function () {
    const input = {}
    const [output, err] = await listAllProjectsHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })

  it("should load all project configs", async function () {
    const { projectConfigRepository } = services
    await projectConfigRepository.saveProjectConfig({
      name: "projectA",
      root: "./projectA",
      commands: {
        run: "",
      },
    })
    await projectConfigRepository.saveProjectConfig({
      name: "projectB",
      root: "./projectB",
      commands: {
        run: "",
      },
    })
    await projectConfigRepository.saveProjectConfig({
      name: "projectC",
      root: "./projectC",
      commands: {
        run: "",
      },
    })
    const input = {}
    const [output, err] = await listAllProjectsHandler(input)

    expect(err).toBeUndefined()
    assert(output, "output should not be null")
    expect(output.projectConfigs).toHaveLength(3)
    expect(output.projectConfigs).toEqual(
      expect.arrayContaining<ProjectConfig>([
        {
          name: "projectA",
          root: "./projectA",
          commands: {
            run: "",
          },
        },
        {
          name: "projectB",
          root: "./projectB",
          commands: {
            run: "",
          },
        },
        {
          name: "projectC",
          root: "./projectC",
          commands: {
            run: "",
          },
        },
      ]),
    )
  })
})
