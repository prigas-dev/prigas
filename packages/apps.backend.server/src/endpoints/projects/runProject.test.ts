import { RunProjectInput } from "apps.backend.api"
import { runProjectHandler, runProjectHandlerInput } from "./runProject.js"

describe("runProject", function () {
  it("should work with valid input", async function () {
    const input: RunProjectHandlerInput = {}
    const [output, err] = await runProjectHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })
})
