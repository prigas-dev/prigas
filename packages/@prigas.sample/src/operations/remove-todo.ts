import { randomUUID } from "node:crypto"
import { RequestContext } from "../lib/request-context.js"

interface RemoveTodoInput {
  title: string
}

export class RemoveTodo {
  async execute(input: RemoveTodoInput, _: RequestContext) {
    console.log(input)

    const output = {
      id: randomUUID(),
      status: "Todo",
      title: input.title,
    }

    return output
  }
}
