import assert from "node:assert"

export interface ParseContext {
  template: string
  index: number
  line: number
  column: number
  insideRepeatBlock: boolean
}

export interface BaseNode {
  kind: number
  text: string
  length: number
  index: number
  line: number
  column: number
}

export const NodeKind = {
  EOF: 0 as const,
  Character: 1 as const,
  String: 2 as const,
  LineBreak: 3 as const,
  Indentation: 4 as const,
  Constant: 5 as const,
  RepeatBlock: 6 as const,
  RepeatBlockOpen: 7 as const,
  RepeatBlockClose: 8 as const,
  Interpolation: 9 as const,
  InterpolationOpen: 10 as const,
  InterpolationClose: 11 as const,
  InterpolationExpression: 12 as const,
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
export interface LineBreakNode extends BaseNode {
  kind: K["LineBreak"]
}
export interface IndentationNode extends BaseNode {
  kind: K["Indentation"]
}
export interface ConstantNode extends BaseNode {
  kind: K["Constant"]
}
export interface RepeatBlockCloseNode extends BaseNode {
  kind: K["RepeatBlockClose"]
  commentMarker: StringNode
}
export interface RepeatBlockOpenNode extends BaseNode {
  kind: K["RepeatBlockOpen"]
  commentMarker: StringNode
}
export interface RepeatBlockNode extends BaseNode {
  kind: K["RepeatBlock"]
  open: RepeatBlockOpenNode
  close: RepeatBlockCloseNode
  nodes: Node[]
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
  | LineBreakNode
  | ConstantNode
  | IndentationNode
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

export function parseTemplate(template: string) {
  const nodes: Node[] = []
  const ctx: ParseContext = {
    template,
    index: 0,
    line: 1,
    column: 1,
    insideRepeatBlock: false,
  }

  let node = peekNode(ctx)
  while (node != null && node.kind !== NodeKind.EOF) {
    nodes.push(node)
    updateContext(ctx, node)
    node = peekNode(ctx)
  }

  return nodes
}

export function peekNode(ctx: ParseContext): Node | null {
  return (
    peekSyntaxMarker(ctx) ??
    // The last thing to check is a constant
    peekConstant(ctx)
  )
}

export function peekSyntaxMarker(ctx: ParseContext): Node | null {
  return (
    peekEOF(ctx) ??
    peekRepeatBlock(ctx) ??
    peekRepeatBlockClose(ctx) ??
    peekLineBreak(ctx) ??
    peekIndentation(ctx) ??
    peekInterpolation(ctx)
  )
}

export function peekEOF(ctx: ParseContext): EOFNode | null {
  if (ctx.index >= ctx.template.length) {
    return makeNode(ctx, NodeKind.EOF, { text: "" })
  }
  return null
}

export function peekLineBreak(ctx: ParseContext): LineBreakNode | null {
  const lineBreakString =
    peekString(ctx, "\n") ?? peekString(ctx, "\r\n") ?? peekString(ctx, "\r")
  if (lineBreakString == null) {
    return null
  }
  const lineBreak = makeNode(ctx, NodeKind.LineBreak, {
    text: lineBreakString.text,
  })
  return lineBreak
}

export function peekIndentation(ctx: ParseContext): IndentationNode | null {
  // Indentations are recognized only at the begin of the line
  if (ctx.column > 1) {
    return null
  }
  const spacesString = peekMany(ctx, " ", "\t")
  if (spacesString == null) {
    return null
  }

  const indentation = makeNode(ctx, NodeKind.Indentation, {
    text: spacesString.text,
  })
  return indentation
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
  const nodes: Node[] = []
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

  // repeat block opens can only happen on new lines
  // or start of file
  let prefix = ""
  const lineBreakBefore = peekLineBreak(currentCtx)
  if (lineBreakBefore == null && currentCtx.index > 0) {
    return null
  }
  if (lineBreakBefore != null) {
    prefix += lineBreakBefore.text

    currentCtx = moved(currentCtx, lineBreakBefore)
  }

  const indentationBefore = peekIndentation(currentCtx)
  if (indentationBefore != null) {
    prefix += indentationBefore.text

    currentCtx = moved(currentCtx, indentationBefore)
  }

  const commentMarker = peekCommentMarker(currentCtx)
  if (commentMarker == null) {
    return null
  }

  currentCtx = moved(currentCtx, commentMarker)
  const openMarker = peekChar(currentCtx, "<")
  if (openMarker == null) {
    return null
  }

  const openText = prefix + commentMarker.text + openMarker.text

  currentCtx = moved(currentCtx, openMarker)
  const lineBreakAfter = peekLineBreak(currentCtx)
  if (lineBreakAfter == null) {
    throw new Error(
      `Open repeat block ${commentMarker.text + openMarker.text} on line ${commentMarker.line} column ${commentMarker.column} must be followed by a line break.`,
    )
  }

  const open = makeNode(ctx, NodeKind.RepeatBlockOpen, {
    text: openText,
    commentMarker: commentMarker,
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

  // repeat block opens can only happen on new lines
  let prefix = ""
  const lineBreakBefore = peekLineBreak(currentCtx)
  if (lineBreakBefore == null) {
    return null
  }
  prefix += lineBreakBefore.text

  currentCtx = moved(currentCtx, lineBreakBefore)
  const indentationBefore = peekIndentation(currentCtx)
  if (indentationBefore != null) {
    prefix += indentationBefore.text

    currentCtx = moved(currentCtx, indentationBefore)
  }

  const commentMarker = peekCommentMarker(currentCtx)
  if (commentMarker == null) {
    return null
  }

  currentCtx = moved(currentCtx, commentMarker)
  const closeMarker = peekChar(currentCtx, ">")
  if (closeMarker == null) {
    return null
  }

  const closeText = prefix + commentMarker.text + closeMarker.text

  currentCtx = moved(currentCtx, closeMarker)
  const lineBreakOrEOFAfter = peekLineBreak(currentCtx) ?? peekEOF(currentCtx)
  if (lineBreakOrEOFAfter == null) {
    throw new Error(
      `Close repeat block ${commentMarker.text + closeMarker.text} on line ${commentMarker.line} column ${commentMarker.column} must be followed by a line break or EOF.`,
    )
  }

  const close = makeNode(ctx, NodeKind.RepeatBlockClose, {
    text: closeText,
    commentMarker: commentMarker,
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

  currentCtx = moved(currentCtx, close)
  const nextOpen = peekInterpolationOpen(currentCtx)
  if (nextOpen != null) {
    throw new Error(
      `Interpolation ${interpolation.text} on line ${ctx.line} column ${ctx.column} cannot be followed immediately by another interpolation`,
    )
  }

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
