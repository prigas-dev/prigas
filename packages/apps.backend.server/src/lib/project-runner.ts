import pty from "@homebridge/node-pty-prebuilt-multiarch"
import { ProjectConfig } from "apps.backend.api"
import { Err, Ok, UnexpectedError, ValidationError } from "libs.result"
import { randomUUID } from "node:crypto"
import os from "node:os"
import type { WebSocket } from "ws"
import { FileManager } from "./file-manager.js"
import { logger } from "./logger.js"

export class ProjectRunner {
  private readonly runningProjects = new Map<string, ProjectRun>()
  constructor(private readonly fileManager: FileManager) {}

  connect(projectName: string, socket: WebSocket) {
    const projectRun = this.getProjectRun(projectName)
    projectRun.addConnection(socket)
  }

  async run(projectConfig: ProjectConfig) {
    logger.info("ProjectRunner.run", { projectConfig })
    const projectRun = this.getProjectRun(projectConfig.name)
    const [_, errStart] = await projectRun.start({
      cwd: projectConfig.root,
      command: projectConfig.commands.run,
    })
    if (errStart != null) {
      return Err(errStart)
    }

    return Ok()
  }

  stop(projectName: string) {
    logger.info("ProjectRunner.stop", { projectName })
    const projectRun = this.getProjectRun(projectName)

    return projectRun.stop()
  }

  private getProjectRun(projectName: string) {
    logger.info("ProjectRunner.getProjectRun", { projectName })

    const projectRun = this.runningProjects.get(projectName)
    if (projectRun != null) {
      logger.debug("ProjectRun.getProjectRun - found projectRun")
      return projectRun
    }

    logger.debug("ProjectRun.getProjectRun - creating new projectRun")
    const newProjectRun = new ProjectRun(projectName, this.fileManager)
    this.runningProjects.set(projectName, newProjectRun)

    return newProjectRun
  }
}

interface ProjectRunStartOptions {
  command: string
  cwd: string
}
class ProjectRun {
  private ptyProcess: pty.IPty | null = null
  private readonly projectConnections = new Set<WebSocket>()
  constructor(
    private readonly projectName: string,
    private readonly fileManager: FileManager,
  ) {}

  async start(options: ProjectRunStartOptions) {
    logger.info("ProjectRun.start", { ...options })

    if (this.ptyProcess != null) {
      logger.debug("ProjectRun.start - PTY process already running", {
        ...options,
      })
      return Ok(this.ptyProcess)
    }

    if (!options.command) {
      return ValidationError(
        `Project ${this.projectName} commands.run must not be empty.`,
      )
    }

    const [cwdStats, errStats] = await this.fileManager.stat(options.cwd)
    if (errStats != null) {
      return Err(errStats)
    }
    if (!cwdStats.isDirectory()) {
      return ValidationError(
        `Project ${this.projectName} root "${options.cwd}" is not a valid directory.`,
      )
    }

    if (os.platform() === "win32") {
      logger.debug("ProjectRun.start - starting PTY process with powershell", {
        ...options,
      })
      try {
        this.ptyProcess = pty.spawn(
          "powershell.exe",
          ["-Command", options.command],
          {
            cwd: options.cwd,
            env: process.env,
          },
        )
      } catch (error) {
        logger.error(
          "ProjectRun.start - failed to start PTY process with powershell",
          {
            ...options,
            error,
          },
        )
        return UnexpectedError(
          `powershell.exe -Command "${options.command}" failed to execute`,
          error,
        )
      }
    } else {
      try {
        logger.debug("ProjectRun.start - starting PTY process with bash", {
          ...options,
        })
        this.ptyProcess = pty.spawn("bash", ["-c", options.command], {
          cwd: options.cwd,
          env: process.env,
        })
      } catch (error) {
        logger.error(
          "ProjectRun.start - failed to start PTY process with bash",
          {
            ...options,
            error,
          },
        )
        return UnexpectedError(
          `bash -c "${options.command}" failed to execute`,
          error,
        )
      }
    }

    this.ptyProcess.onExit(({ exitCode, signal }) => {
      logger.info("PTY process finished. Deleting process reference.", {
        ...options,
        exitCode,
        signal,
      })
      this.ptyProcess = null
    })

    for (const socket of this.projectConnections) {
      this.connectWithPtyProcess(socket)
    }

    return Ok(this.ptyProcess)
  }

  stop() {
    if (this.ptyProcess == null) {
      logger.debug("ProjectRun.stop - PTY process already stopped", {
        projectName: this.projectName,
      })
      return Ok()
    }

    try {
      this.ptyProcess.kill()
    } catch (error) {
      return UnexpectedError(`Failed to kill PTY process`, error)
    }

    return Ok()
  }

  addConnection(socket: WebSocket) {
    logger.info("ProjectRun.addConnection", { projectName: this.projectName })
    this.projectConnections.add(socket)

    socket.on("close", () => {
      logger.info(
        "Socket connection was closed. Removing closed socket connection.",
        { projectName: this.projectName },
      )
      this.projectConnections.delete(socket)
    })

    this.connectWithPtyProcess(socket)
  }

  private connectWithPtyProcess(socket: WebSocket) {
    logger.info("ProjectRun.connectWithPtyProcess", {
      projectName: this.projectName,
    })

    if (this.ptyProcess == null) {
      logger.debug(
        "ProjectRun.connectWithPtyProcess - PTY process has not started",
        { projectName: this.projectName },
      )
      return
    }

    const sessionId = randomUUID()
    socket.send(`Started: ${sessionId}\r\n`)

    const ptyProcess = this.ptyProcess

    const d0 = ptyProcess.onData((data) => {
      logger.debug(`stdout: ${data}`, { projectName: this.projectName })
      socket.send(data)
    })

    const messageListener = (data: string) => {
      logger.debug(`stdin: ${data}`, { projectName: this.projectName })
      ptyProcess.write(data)
    }
    socket.on("message", messageListener)

    const d1 = ptyProcess.onExit(({ exitCode, signal }) => {
      logger.info("PTY process finished. Disposing Socket event handlers.", {
        projectName: this.projectName,
        exitCode,
        signal,
      })
      socket.off("message", messageListener)
      socket.off("close", closeListener)
      socket.send(`Finished: ${sessionId}\r\n`)
    })

    const closeListener = () => {
      logger.info(
        "Socket connection was closed. Disposing PTY process event handlers.",
        { projectName: this.projectName },
      )
      d0.dispose()
      d1.dispose()
    }
    socket.on("close", closeListener)
  }
}
