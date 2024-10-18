/* eslint-disable @typescript-eslint/no-unsafe-return */

import { z } from "zod"
import { AppContext } from "../~app-context-factory.js"

// import { parse, zd } from "./auto-parser.js"

const AssigneeSchema = z.object({
  assigneeId: z.string(),
})
const AddTodoInputSchema = z.object({
  summary: z.string(),
  description: z.string(),
  assignees: AssigneeSchema.array(),
})
type AddTodoInput = z.output<typeof AddTodoInputSchema>

export class Handler {
  @parse(zd(AddTodoInputSchema))
  async addTodo(input: AddTodoInput, ctx: AppContext) {
    const addedTodo = await ctx.todosRepository.addTodo(input)
    return addedTodo
  }
}

/**
 * POST /api/addTodo
 *
 */

function parse<
  This,
  Args extends [unknown, AppContext],
  Return extends Promise<unknown>,
  ValueType,
>(parseFn: (value: ValueType) => Promise<Args[0] | ParseError>) {
  function parseCall(
    method: (this: This, ...args: Args) => Return,
    _: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>,
  ): (this: This, ...args: Args) => Return {
    return async function (this: This, ...args: Args) {
      const value = args[0] as ValueType
      const parseResult = await parseFn(value)
      if (parseResult instanceof ParseError) {
        throw parseResult
      }
      const result = await method.apply(this, [parseResult, args[1]] as Args)
      return result
    } as (this: This, ...args: Args) => Return
  }
  return parseCall
}

function zd<ZSchema extends z.ZodTypeAny>(schema: ZSchema) {
  return async function (value: z.input<ZSchema>) {
    const result = await schema.safeParseAsync(value)
    if (result.success) {
      return result.data
    }
    return new ParseError()
  }
}

zd.file = function () {
  return 12
}

class ParseError extends Error {}
