import { randomUUID } from "node:crypto"

interface AddTodoInput {
  title: string
}

type Context = string

export class AddTodo {
  async addTodo(input: AddTodoInput, _: Context) {
    console.log(input)

    const output = {
      id: randomUUID(),
      status: "Todo",
      title: input.title,
    }

    return output
  }
}
