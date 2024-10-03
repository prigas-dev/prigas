import { stopProjectHandler } from "./stopProject.js"

describe("stopProject", function () {
  it("should work with valid input", async function () {
    const input: StopProjectHandlerInput = {}
    const [output, err] = await stopProjectHandler(input)

    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })
})
