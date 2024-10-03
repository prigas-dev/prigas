import { AddProjectInput } from "apps.backend.api"
import path from "node:path"
import { env } from "../../env.js"
import { jsonStringify } from "../../lib/json.js"
import { services } from "../../lib/services.js"
import { addProjectHandler } from "./addProject.js"

describe("addProject", function () {
  it("should work with valid input", async function () {
    const input: AddProjectInput = {
      projectConfig: {
        root: ".",
        name: "Default Project",
      },
    }
    const [output, err] = await addProjectHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })

  it("should create project.prigas.json file", async function () {
    const input: AddProjectInput = {
      projectConfig: {
        root: ".",
        name: "Default Project",
      },
    }
    const [_, err] = await addProjectHandler(input)

    expect(err).toBeUndefined()

    const createdFile = await services.fileManager.readFile(
      path.join(
        env.WorkspaceDirectory,
        "projects",
        "Default Project",
        "project.prigas.json",
      ),
    )
    expect(createdFile).not.toBeNull()
  })

  it("should return error when project file already exists", async function () {
    const [_, errFile] = await services.fileManager.writeFile(
      path.join(
        env.WorkspaceDirectory,
        "projects",
        "Default Project",
        "project.prigas.json",
      ),
      {},
    )
    assert.isNotOk(
      errFile,
      `Did not expect error on file write. ${jsonStringify(errFile)}.`,
    )

    const input: AddProjectInput = {
      projectConfig: {
        root: ".",
        name: "Default Project",
      },
    }
    const [__, err] = await addProjectHandler(input)

    expect(err?.type).toEqual("ValidationError")
  })
})
