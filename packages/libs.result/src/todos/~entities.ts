export interface Todo {
  todoId: string
  summary: string
  description: string
  assignees: Assignee[]
}

export interface Assignee {
  assigneeId: string
  name: string
  email: string
  profilePictureUrl: string
}
