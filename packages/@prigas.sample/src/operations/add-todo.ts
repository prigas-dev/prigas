import { randomUUID } from "node:crypto"
import { RequestContext } from "../lib/request-context.js"

interface AddTodoInput {
  title: string
}

export class AddTodo {
  async execute(input: AddTodoInput, _: RequestContext) {
    console.log(input)

    const output = {
      id: randomUUID(),
      status: "Todo",
      title: input.title,
    }

    return output
  }
}
