import { homedir } from "node:os"
import path from "node:path"

export const env = {
  Port: Number(process.env.PORT) || 8081,
  WorkspaceDirectory:
    process.env.PRIGAS_WORKSPACE_DIRECTORY ?? path.join(homedir(), ".prigas"),
}
