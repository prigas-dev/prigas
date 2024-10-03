import { services } from "../../lib/services.js"
import { getProjectHandler, GetProjectHandlerInput } from "./getProject.js"

describe("getProject", function () {
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
    const input: GetProjectHandlerInput = {
      projectName: "Project Name",
    }
    const [output, err] = await getProjectHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })
})
