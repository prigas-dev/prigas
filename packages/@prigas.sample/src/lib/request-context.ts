import { IncomingMessage } from "http"

export interface RequestContext {
  user: User
}

export interface User {
  id: string
  name: string
}

export async function createContext(
  _: IncomingMessage,
): Promise<RequestContext> {
  const ctx: RequestContext = {
    user: {
      id: "123",
      name: "Roberto",
    },
  }

  return ctx
}
