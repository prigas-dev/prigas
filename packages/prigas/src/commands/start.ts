import { Command } from "@oclif/core"
import { startPrigasServer } from "@prigas/server"

export default class Start extends Command {
  static override description = "Start prigas service."

  static override examples = ["<%= config.bin %> <%= command.id %>"]

  public async run(): Promise<void> {
    const _ = await this.parse(Start)

    await startPrigasServer()
  }
}
