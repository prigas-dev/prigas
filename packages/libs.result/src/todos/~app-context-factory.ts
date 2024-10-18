import { Todo } from "./~entities.js"

export interface AppContext {
  todosRepository: TodosRepository
}

export interface AddTodoData {
  summary: string
  description: string
  assignees: Assignee[]
}

export interface Assignee {
  assigneeId: string
}
export interface TodosRepository {
  getTodos(): Promise<Todo[]>
  addTodo(todoData: AddTodoData): Promise<Todo>
}

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace express {
  export interface Request {
    // Usually you would not have to read the body to
    // grab context data, but here it is anyway in case
    // you need it.
    body: ReadableStream
    queryParams: Partial<Record<string, string | string[]>>
    headers: Partial<Record<string, string | string[]>>
    cookies: Partial<Record<string, Cookie>>
  }
  export interface Cookie {
    name: string
    value: string
    expiresAt: Date
    // ...
  }
}

export function appContextFactory(_: express.Request): AppContext {
  return null as unknown as AppContext
}
