import {
  ConstantNode,
  InterpolationNode,
  Node,
  NodeKind,
  parseTemplate,
  RepeatBlockNode,
  TemplateNode,
} from "./template-parser.js"

export function generate(
  source: string,
  templateString: string,
  substitutions: Record<string, string>,
) {
  const template = parseTemplate(templateString)
  const model = mapModel(source, template.nodes)
  mergeModel(substitutions, model, template.nodes)

  return printModel(model, template.nodes)
}

interface MapModelContext {
  source: string
  sourceWithoutWhitespaces: string
  currentSourceIndex: number
}

export interface Model {
  interpolations: Record<string, string>
  repeatBlocks: RepeatBlock[]
  start: number
  end: number
}
export interface RepeatBlock {
  blocks: Model[]
}

export function mapModel(
  source: string,
  nodes: TemplateNode[],
  offset?: number,
): Model {
  const model: Model = {
    start: 0,
    end: 0,
    interpolations: {},
    repeatBlocks: [],
  }
  const ctx: MapModelContext = {
    source: source,
    sourceWithoutWhitespaces: removeWhitespaces(source),
    currentSourceIndex: offset ?? 0,
  }
  for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
    const currentNode = nodes[nodeIndex]
    const nextNode = nodes.at(nodeIndex + 1)

    const matchedNode = matchNode(ctx, model, currentNode, nextNode)

    ctx.currentSourceIndex = matchedNode.nextIndex
    if (nodeIndex === 0) {
      model.start = matchedNode.start
    }
    // Assuming that on Interpolation we skip the constant
    if (matchedNode.type === "Interpolation") {
      nodeIndex += 1
    }
    if (nodeIndex >= nodes.length - 1) {
      model.end = matchedNode.nextIndex
    }
  }

  return model
}

function matchNode(
  ctx: MapModelContext,
  model: Model,
  currentNode: TemplateNode,
  nextNode: TemplateNode | undefined,
): ConstantMatched | InterpolationMatched | RepeatBlockMatched {
  if (currentNode.kind === NodeKind.Constant) {
    const constantMatched = matchConstant(ctx, currentNode, { throws: true })
    return constantMatched
  }

  if (currentNode.kind === NodeKind.Interpolation) {
    const interpolationMatched = matchInterpolation(ctx, currentNode, nextNode)

    const { key, value } = interpolationMatched
    model.interpolations[key] = value

    return interpolationMatched
  }

  if (currentNode.kind === NodeKind.RepeatBlock) {
    const repeatBlockMatched = matchRepeatBlock(ctx, currentNode, nextNode)

    const { repeatBlock } = repeatBlockMatched
    model.repeatBlocks.push(repeatBlock)

    return repeatBlockMatched
  }

  throw new Error(`Unexpected node kind ${(currentNode as Node).kind}`)
}

interface MatchConstantOptions {
  /**
   * false by default
   */
  throws?: boolean
}

interface ConstantMatched {
  type: "Constant"
  start: number
  end: number
  nextIndex: number
}

function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
): ConstantMatched | null
function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
  options: MatchConstantOptions & { throws?: undefined },
): ConstantMatched | null
function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
  options: MatchConstantOptions & { throws: false },
): ConstantMatched | null
function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
  options: MatchConstantOptions & { throws: true },
): ConstantMatched
function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
  options: MatchConstantOptions,
): ConstantMatched | null
function matchConstant(
  ctx: MapModelContext,
  node: ConstantNode,
  { throws = false }: MatchConstantOptions = {},
): ConstantMatched | null {
  const constantWithoutWhitespaces = removeWhitespaces(node.text)
  if (constantWithoutWhitespaces.length === 0) {
    return {
      type: "Constant",
      start: ctx.currentSourceIndex,
      end: ctx.currentSourceIndex,
      nextIndex: ctx.currentSourceIndex,
    }
  }
  const indexOfConstantOnSource = ctx.sourceWithoutWhitespaces.indexOf(
    constantWithoutWhitespaces,
    ctx.currentSourceIndex,
  )
  if (indexOfConstantOnSource < 0) {
    if (throws) {
      throw new Error(
        `Source \`${ctx.source}\` does not contain a substring matching the constant \`${node.text}\`.`,
      )
    }
    return null
  }

  const constantStart = indexOfConstantOnSource
  const constantEnd =
    indexOfConstantOnSource + constantWithoutWhitespaces.length
  const nextIndex = constantEnd

  return {
    type: "Constant",
    start: constantStart,
    end: constantEnd,
    nextIndex: nextIndex,
  }
}

interface InterpolationMatched {
  type: "Interpolation"
  start: number
  end: number
  nextIndex: number
  key: string
  value: string
}
function matchInterpolation(
  ctx: MapModelContext,
  currentNode: InterpolationNode,
  nextNode: TemplateNode | undefined,
): InterpolationMatched {
  const interpolationStart = ctx.currentSourceIndex
  let interpolationEnd = ctx.sourceWithoutWhitespaces.length
  let nextIndex = interpolationEnd

  if (nextNode != null) {
    if (nextNode.kind !== NodeKind.Constant) {
      throw new Error(
        `Template interpolation ${currentNode.text} must have a constant after it to be identifiable.`,
      )
    }
    const constantPosition = matchConstant(ctx, nextNode, { throws: true })
    interpolationEnd = constantPosition.start
    nextIndex = constantPosition.end
  }

  const key = currentNode.expression.text
  const value = ctx.sourceWithoutWhitespaces.substring(
    interpolationStart,
    interpolationEnd,
  )

  return {
    type: "Interpolation",
    start: interpolationStart,
    end: interpolationEnd,
    nextIndex: nextIndex,
    key: key,
    value: value,
  }
}

interface RepeatBlockMatched {
  type: "RepeatBlock"
  start: number
  end: number
  nextIndex: number
  repeatBlock: RepeatBlock
}
function matchRepeatBlock(
  ctx: MapModelContext,
  currentNode: RepeatBlockNode,
  nextNode: TemplateNode | undefined,
): RepeatBlockMatched {
  // cloning because we update the context in this function
  ctx = { ...ctx }

  const repeatBlockStart = ctx.currentSourceIndex
  let repeatBlockEnd = ctx.currentSourceIndex

  // let's first assume nextNode is a constant with non space characters
  const constantAfterBlock = nextNode as ConstantNode

  const repeatBlock: RepeatBlock = {
    blocks: [],
  }

  while (true) {
    const constantAfterBlockPosition = matchConstant(ctx, constantAfterBlock, {
      throws: true,
    })
    const blockFirstNonSpaceConstant = currentNode.nodes.find(
      (node): node is ConstantNode =>
        node.kind === NodeKind.Constant &&
        removeWhitespaces(node.text).length > 0,
    )
    if (blockFirstNonSpaceConstant == null) {
      throw new Error(
        "Repeat blocks must have at least 1 non space constant to work.",
      )
    }
    const blockFirstNonSpaceConstantPosition = matchConstant(
      ctx,
      blockFirstNonSpaceConstant,
    )

    if (
      blockFirstNonSpaceConstantPosition == null ||
      blockFirstNonSpaceConstantPosition.start >=
        constantAfterBlockPosition.start
    ) {
      break
    }

    const nextModel = mapModel(
      ctx.source,
      currentNode.nodes,
      ctx.currentSourceIndex,
    )

    repeatBlock.blocks.push(nextModel)

    repeatBlockEnd = nextModel.end
    ctx.currentSourceIndex = nextModel.end
  }

  return {
    type: "RepeatBlock",
    start: repeatBlockStart,
    end: repeatBlockEnd,
    nextIndex: repeatBlockEnd,
    repeatBlock: repeatBlock,
  }
}

const whitespaceRegex = /[\s\n]+/g

function removeWhitespaces(str: string) {
  return str.replaceAll(whitespaceRegex, "")
}

export function mergeModel(
  substitutions: Record<string, string>,
  model: Model,
  nodes: TemplateNode[],
) {
  const modelToMerge = createModelFromTemplateAndSubstitutions(
    substitutions,
    nodes,
  )
  mergeModelInternal(substitutions, model, modelToMerge)
}
function mergeModelInternal(
  substitutions: Record<string, string>,
  model: Model,
  modelToMerge: Model,
) {
  for (const [key, value] of Object.entries(modelToMerge.interpolations)) {
    model.interpolations[key] = value
  }

  for (
    let repeatBlockIndex = 0;
    repeatBlockIndex < modelToMerge.repeatBlocks.length;
    repeatBlockIndex++
  ) {
    const sourceRepeatBlock = modelToMerge.repeatBlocks[repeatBlockIndex]
    const sourceModel = sourceRepeatBlock.blocks[0]
    const targetRepeatBlock = model.repeatBlocks[repeatBlockIndex]
    const targetModel = targetRepeatBlock.blocks.find((blockModel) =>
      matchesInterpolations(blockModel, substitutions),
    )

    if (targetModel == null) {
      targetRepeatBlock.blocks.push(sourceModel)
    } else {
      mergeModelInternal(substitutions, targetModel, sourceModel)
    }
  }
}

function createModelFromTemplateAndSubstitutions(
  substitutions: Record<string, string>,
  nodes: TemplateNode[],
): Model {
  const model: Model = {
    start: 0,
    end: 0,
    interpolations: {},
    repeatBlocks: [],
  }

  for (const node of nodes) {
    if (node.kind === NodeKind.Interpolation) {
      const key = node.expression.text
      const value = substitutions[key]
      model.interpolations[key] = value
    }
    if (node.kind === NodeKind.RepeatBlock) {
      const repeatBlockModel = createModelFromTemplateAndSubstitutions(
        substitutions,
        node.nodes,
      )
      const repeatBlock: RepeatBlock = {
        blocks: [repeatBlockModel],
      }
      model.repeatBlocks.push(repeatBlock)
    }
  }

  return model
}

function matchesInterpolations(
  model: Model,
  substitutions: Record<string, string>,
) {
  for (const [key, value] of Object.entries(model.interpolations)) {
    if (substitutions[key] !== value) {
      return false
    }
  }
  return true
}

export function printModel(model: Model, nodes: TemplateNode[]) {
  let accumulated = ""
  let repeatBlockIndex = 0
  for (const node of nodes) {
    if (node.kind === NodeKind.Constant) {
      accumulated += node.text
    }
    if (node.kind === NodeKind.Interpolation) {
      const key = node.expression.text
      const value = model.interpolations[key]
      accumulated += value
    }
    if (node.kind === NodeKind.RepeatBlock) {
      const repeatBlock = model.repeatBlocks[repeatBlockIndex]
      for (const block of repeatBlock.blocks) {
        accumulated += printModel(block, node.nodes)
      }

      repeatBlockIndex += 1
    }
  }
  return accumulated
}
