import { PromiseExecutor } from "@nx/devkit"
import { rm } from "node:fs/promises"
import path from "node:path"
import { CleanExecutorOptions } from "./schema"

const runExecutor: PromiseExecutor<CleanExecutorOptions> = async (
  options,
  ctx,
) => {
  await rm(path.join(ctx.root, options.dir), { recursive: true, force: true })

  return {
    success: true,
  }
}

export default runExecutor
