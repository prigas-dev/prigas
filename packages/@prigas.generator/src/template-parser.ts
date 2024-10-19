import assert from "node:assert"

export interface ParseContext {
  template: string
  index: number
  line: number
  column: number
  insideRepeatBlock: boolean
}

export interface BaseNode {
  kind: string
  text: string
  length: number
  index: number
  line: number
  column: number
}

export const NodeKind = {
  EOF: "EOF" as const,
  Character: "Character" as const,
  Whitespace: "Whitespace" as const,
  String: "String" as const,
  Constant: "Constant" as const,
  RepeatBlock: "RepeatBlock" as const,
  RepeatBlockOpen: "RepeatBlockOpen" as const,
  RepeatBlockClose: "RepeatBlockClose" as const,
  Interpolation: "Interpolation" as const,
  InterpolationOpen: "InterpolationOpen" as const,
  InterpolationClose: "InterpolationClose" as const,
  InterpolationExpression: "InterpolationExpression" as const,
}
type K = typeof NodeKind

export interface EOFNode extends BaseNode {
  kind: K["EOF"]
  text: ""
}
export interface CharacterNode extends BaseNode {
  kind: K["Character"]
}
export interface StringNode extends BaseNode {
  kind: K["String"]
}
export interface WhitespaceNode extends BaseNode {
  kind: K["Whitespace"]
}
export interface ConstantNode extends BaseNode {
  kind: K["Constant"]
}
export interface RepeatBlockCloseNode extends BaseNode {
  kind: K["RepeatBlockClose"]
  commentMarker: StringNode
  closeMarker: StringNode
}
export interface RepeatBlockOpenNode extends BaseNode {
  kind: K["RepeatBlockOpen"]
  commentMarker: StringNode
  openMarker: StringNode
}
export interface RepeatBlockNode extends BaseNode {
  kind: K["RepeatBlock"]
  open: RepeatBlockOpenNode
  close: RepeatBlockCloseNode
  nodes: TemplateNode[]
}
export interface InterpolationCloseNode extends BaseNode {
  kind: K["InterpolationClose"]
}
export interface InterpolationOpenNode extends BaseNode {
  kind: K["InterpolationOpen"]
}
export interface InterpolationExpressionNode extends BaseNode {
  kind: K["InterpolationExpression"]
}
export interface InterpolationNode extends BaseNode {
  kind: K["Interpolation"]
  open: InterpolationOpenNode
  close: InterpolationCloseNode
  expression: InterpolationExpressionNode
}

export type Node =
  | EOFNode
  | CharacterNode
  | StringNode
  | WhitespaceNode
  | ConstantNode
  | RepeatBlockOpenNode
  | RepeatBlockCloseNode
  | RepeatBlockNode
  | InterpolationOpenNode
  | InterpolationCloseNode
  | InterpolationExpressionNode
  | InterpolationNode
export type NodeKind = K[keyof K]

export type NodeOfKind<TNodeKind extends NodeKind> = Extract<
  Node,
  { kind: TNodeKind }
>

export interface Template {
  nodes: TemplateNode[]
}
const templateNodeKinds = [
  NodeKind.Constant,
  NodeKind.RepeatBlock,
  NodeKind.Interpolation,
] as const
type TemplateNodeKind = (typeof templateNodeKinds)[number]
export type TemplateNode = NodeOfKind<TemplateNodeKind>

function assertTemplateNode(node: Node): asserts node is TemplateNode {
  assert(
    templateNodeKinds.includes(node.kind as TemplateNodeKind),
    `did not expect node of kind ${node.kind}`,
  )
}

export function parseTemplate(template: string): Template {
  const nodes: TemplateNode[] = []
  const ctx: ParseContext = {
    template,
    index: 0,
    line: 1,
    column: 1,
    insideRepeatBlock: false,
  }

  let node = peekNode(ctx)
  while (node != null && node.kind !== NodeKind.EOF) {
    assertTemplateNode(node)
    nodes.push(node)
    updateContext(ctx, node)
    node = peekNode(ctx)
  }

  const parsedTemplate: Template = {
    nodes: nodes,
  }
  return parsedTemplate
}

export function peekNode(ctx: ParseContext) {
  return (
    peekSyntaxMarker(ctx) ??
    // The last thing to check is a constant
    peekConstant(ctx)
  )
}

export function peekSyntaxMarker(ctx: ParseContext) {
  return (
    peekEOF(ctx) ??
    peekRepeatBlock(ctx) ??
    peekRepeatBlockClose(ctx) ??
    peekInterpolation(ctx)
  )
}

export function peekEOF(ctx: ParseContext): EOFNode | null {
  if (ctx.index >= ctx.template.length) {
    return makeNode(ctx, NodeKind.EOF, { text: "" })
  }
  return null
}

export function peekWhitespace(ctx: ParseContext): WhitespaceNode | null {
  const spacesString = peekMany(ctx, " ", "\t", "\n", "\r")
  if (spacesString == null) {
    return null
  }

  const whitespace = makeNode(ctx, NodeKind.Whitespace, {
    text: spacesString.text,
  })
  return whitespace
}

export function peekConstant(ctx: ParseContext): ConstantNode | null {
  let currentCtx = ctx
  let accumulated = ""
  let nextNode = peekSyntaxMarker(currentCtx) ?? peekChar(currentCtx)
  while (nextNode != null && nextNode.kind === NodeKind.Character) {
    accumulated += nextNode.text
    currentCtx = moved(currentCtx, nextNode)
    nextNode = peekSyntaxMarker(currentCtx) ?? peekChar(currentCtx)
  }
  if (accumulated.length === 0) {
    return null
  }

  const constant = makeNode(ctx, NodeKind.Constant, { text: accumulated })
  return constant
}

export function peekRepeatBlock(ctx: ParseContext): RepeatBlockNode | null {
  let currentCtx = ctx

  const open = peekRepeatBlockOpen(ctx)
  if (open == null) {
    return null
  }

  currentCtx = moved(currentCtx, open)
  currentCtx.insideRepeatBlock = true
  const nodes: TemplateNode[] = []
  let nextNode = peekNode(currentCtx)
  while (nextNode != null && nextNode.kind !== NodeKind.EOF) {
    if (nextNode.kind === NodeKind.RepeatBlockClose) {
      const hasVariables = nodes.some(
        (node) => node.kind === NodeKind.Interpolation,
      )
      if (!hasVariables) {
        throw new Error(
          `Repeat block on line ${open.line} column ${open.column} must have at least 1 interpolation.`,
        )
      }

      const close = nextNode

      const text =
        open.text + nodes.map((node) => node.text).join("") + close.text

      return makeNode(ctx, NodeKind.RepeatBlock, { text, open, close, nodes })
    }
    nodes.push(nextNode)
    currentCtx = moved(currentCtx, nextNode)
    nextNode = peekNode(currentCtx)
  }

  throw new Error(
    `Open repeat block ${open.text.trim()} on line ${ctx.line} column ${ctx.column} is not closed. Did you forget to add a ${open.commentMarker.text}> ?`,
  )
}

export function peekRepeatBlockOpen(
  ctx: ParseContext,
): RepeatBlockOpenNode | null {
  let currentCtx = ctx

  // whitespace before is peeked because we ignore them to
  // generate content
  const whitespaceBefore = peekWhitespace(currentCtx)
  if (whitespaceBefore == null && currentCtx.index > 0) {
    return null
  }
  if (whitespaceBefore != null) {
    currentCtx = moved(currentCtx, whitespaceBefore)
  }

  const commentMarker = peekCommentMarker(currentCtx)
  if (commentMarker == null) {
    return null
  }

  currentCtx = moved(currentCtx, commentMarker)
  const openMarker = peekString(currentCtx, "<")
  if (openMarker == null) {
    return null
  }

  const text =
    (whitespaceBefore?.text ?? "") + commentMarker.text + openMarker.text

  const open = makeNode(ctx, NodeKind.RepeatBlockOpen, {
    text: text,
    commentMarker: commentMarker,
    openMarker: openMarker,
  })
  return open
}

export function peekRepeatBlockClose(
  ctx: ParseContext,
): RepeatBlockCloseNode | null {
  if (!ctx.insideRepeatBlock) {
    return null
  }
  let currentCtx = ctx

  // whitespace before is picked because we ignore them to
  // generate content
  const whitespaceBefore = peekWhitespace(currentCtx)
  if (whitespaceBefore == null && currentCtx.index > 0) {
    return null
  }
  if (whitespaceBefore != null) {
    currentCtx = moved(currentCtx, whitespaceBefore)
  }

  const commentMarker = peekCommentMarker(currentCtx)
  if (commentMarker == null) {
    return null
  }

  currentCtx = moved(currentCtx, commentMarker)
  const closeMarker = peekString(currentCtx, ">")
  if (closeMarker == null) {
    return null
  }

  const text =
    (whitespaceBefore?.text ?? "") + commentMarker.text + closeMarker.text

  const close = makeNode(ctx, NodeKind.RepeatBlockClose, {
    text: text,
    commentMarker: commentMarker,
    closeMarker: closeMarker,
  })
  return close
}

export function peekCommentMarker(ctx: ParseContext): StringNode | null {
  return peekString(ctx, "//") ?? peekString(ctx, "#")
}

export function peekInterpolation(ctx: ParseContext): InterpolationNode | null {
  const open = peekInterpolationOpen(ctx)
  if (open == null) {
    return null
  }
  let currentCtx = moved(ctx, open)
  const expressionString = peekUntil(currentCtx, "__")
  if (expressionString == null) {
    throw new Error(
      `Open interpolation ${open.text} on line ${ctx.line} column ${ctx.column} is not closed. Did you forget to add a __ ?`,
    )
  }
  if (expressionString.text.trim() === "") {
    throw new Error(
      `Interpolation expression ${open.text} on line ${ctx.line} column ${ctx.column} is empty.`,
    )
  }

  const expression = makeNode(currentCtx, NodeKind.InterpolationExpression, {
    text: expressionString.text,
  })

  currentCtx = moved(currentCtx, expressionString)
  const close = peekInterpolationClose(currentCtx)
  if (close == null) {
    throw new Error(
      `Open interpolation ${open.text} on line ${ctx.line} column ${ctx.column} is not closed. Did you forget to add a __ ?`,
    )
  }

  const text = open.text + expression.text + close.text
  const interpolation = makeNode(ctx, NodeKind.Interpolation, {
    open,
    close,
    expression,
    text,
  })

  return interpolation
}

export function peekInterpolationOpen(
  ctx: ParseContext,
): InterpolationOpenNode | null {
  const openString = peekString(ctx, "__")
  if (openString == null) {
    return null
  }

  const open = makeNode(ctx, NodeKind.InterpolationOpen, {
    text: openString.text,
  })
  return open
}

export function peekInterpolationClose(
  ctx: ParseContext,
): InterpolationCloseNode | null {
  const closeString = peekString(ctx, "__")
  if (closeString == null) {
    return null
  }

  const close = makeNode(ctx, NodeKind.InterpolationClose, {
    text: closeString.text,
  })
  return close
}

export function peekUntil(ctx: ParseContext, str: string): StringNode | null {
  let currentCtx = ctx

  let accumulated = ""
  let nextNode = peekString(currentCtx, str) ?? peekChar(ctx)
  while (nextNode != null) {
    if (nextNode.kind === NodeKind.String) {
      const capturedString = makeNode(ctx, NodeKind.String, {
        text: accumulated,
      })
      return capturedString
    }

    accumulated += nextNode.text
    currentCtx = moved(currentCtx, nextNode)
    nextNode = peekString(currentCtx, str) ?? peekChar(currentCtx)
  }

  return null
}

export function peekString(ctx: ParseContext, str: string): StringNode | null {
  let charIndex = 0
  let currentCtx = ctx
  let nextChar = peekChar(currentCtx, str[charIndex])
  while (nextChar != null) {
    charIndex += 1
    if (charIndex >= str.length) {
      const string = makeNode(ctx, NodeKind.String, { text: str })
      return string
    }
    currentCtx = moved(currentCtx, nextChar)
    nextChar = peekChar(currentCtx, str[charIndex])
  }
  return null
}

export function peekMany(
  ctx: ParseContext,
  ...chars: string[]
): StringNode | null {
  let nextChar = peekAnyOf(ctx, ...chars)
  if (nextChar == null) {
    return null
  }
  let accumulated = ""
  let currentCtx = ctx
  while (nextChar != null) {
    accumulated += nextChar.text
    currentCtx = moved(currentCtx, nextChar)
    nextChar = peekAnyOf(currentCtx, ...chars)
  }

  const string = makeNode(ctx, NodeKind.String, { text: accumulated })
  return string
}

export function peekAnyOf(
  ctx: ParseContext,
  ...chars: string[]
): CharacterNode | null {
  for (const char of chars) {
    const node = peekChar(ctx, char)
    if (node != null) {
      return node
    }
  }
  return null
}

export function peekChar(
  ctx: ParseContext,
  char?: string,
): CharacterNode | null {
  assert(char == null || char.length === 1, "char length must be 1")
  if (ctx.index >= ctx.template.length) {
    return null
  }
  const currentChar = ctx.template[ctx.index]
  if (char != null && currentChar !== char) {
    return null
  }

  const node = makeNode(ctx, NodeKind.Character, { text: currentChar })
  return node
}

export function makeNode<TNodeKind extends NodeKind>(
  ctx: ParseContext,
  kind: TNodeKind,
  otherAttributes: Omit<
    NodeOfKind<TNodeKind>,
    "kind" | "length" | "line" | "column" | "index"
  >,
) {
  assert(otherAttributes.text != null, "text attribute is required")
  const node = {
    kind,
    ...otherAttributes,
    length: otherAttributes.text.length,
    line: ctx.line,
    column: ctx.column,
    index: ctx.index,
  }
  return node
}

export function updateContext(ctx: ParseContext, node: Node): void {
  Object.assign(ctx, moved(ctx, node))
}

export function moved(ctx: ParseContext, node: Node): ParseContext {
  const newCtx = { ...ctx }

  newCtx.index += node.length
  const lines = node.text.split(/\n|\r\n|\r/)

  const breakLineCount = lines.length - 1

  if (breakLineCount > 0) {
    newCtx.line += breakLineCount
    newCtx.column = 1
  }

  const lastLine = lines[lines.length - 1]
  newCtx.column += lastLine.length

  return newCtx
}
