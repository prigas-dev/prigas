import { PromiseExecutor } from "@nx/devkit"
import esbuild, { BuildOptions } from "esbuild"
import path from "node:path"
import { EsbuildExecutorOptions } from "./schema"

const runExecutor: PromiseExecutor<EsbuildExecutorOptions> = async (
  options,
  ctx,
) => {
  const projectRoot = path.join(
    ctx.root,
    ctx.projectsConfigurations?.projects?.[ctx.projectName ?? ""].root ?? ".",
  )
  const { esbuildConfig } = (await import(
    path.join(projectRoot, "esbuild.config.mjs")
  )) as {
    esbuildConfig: BuildOptions
  }
  await esbuild.build({
    ...esbuildConfig,
    absWorkingDir: projectRoot,
    minify: !options.dev,
  })

  return {
    success: true,
  }
}

export default runExecutor
