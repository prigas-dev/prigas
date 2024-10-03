import { rm } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { env } from "./src/env.js"

env.WorkspaceDirectory = path.join(os.tmpdir(), ".prigas")

beforeEach(async function () {
  await rm(env.WorkspaceDirectory, { recursive: true, force: true })
})

afterAll(async function () {
  await rm(env.WorkspaceDirectory, { recursive: true, force: true })
})
