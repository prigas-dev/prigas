import {
  CharacterNode,
  ConstantNode,
  EOFNode,
  IndentationNode,
  InterpolationCloseNode,
  InterpolationExpressionNode,
  InterpolationNode,
  InterpolationOpenNode,
  LineBreakNode,
  makeNode,
  moved,
  Node,
  NodeKind,
  ParseContext,
  parseTemplate,
  peekAnyOf,
  peekChar,
  peekCommentMarker,
  peekConstant,
  peekEOF,
  peekIndentation,
  peekInterpolation,
  peekInterpolationClose,
  peekInterpolationOpen,
  peekLineBreak,
  peekMany,
  peekRepeatBlock,
  peekRepeatBlockClose,
  peekRepeatBlockOpen,
  peekString,
  peekUntil,
  RepeatBlockCloseNode,
  RepeatBlockNode,
  RepeatBlockOpenNode,
  StringNode,
  updateContext,
} from "./template-parser.js"

describe("moved", function () {
  it("should not move context on empty node", function () {
    const ctx = buildContext()
    const node = makeNode(ctx, NodeKind.String, { text: "" })
    const movedCtx = moved(ctx, node)

    expect(movedCtx).toEqual<ParseContext>({
      ...ctx,
      index: 0,
      column: 1,
      line: 1,
    })
  })
  it("should move context on same line", function () {
    const ctx = buildContext()
    const node = makeNode(ctx, NodeKind.String, { text: "some text" })
    const movedCtx = moved(ctx, node)

    expect(movedCtx).toEqual<ParseContext>({
      ...ctx,
      index: 9,
      column: 10,
      line: 1,
    })
  })
  it("should move context on next line", function () {
    const ctx = buildContext()
    const node = makeNode(ctx, NodeKind.String, { text: "some text\n" })
    const movedCtx = moved(ctx, node)

    expect(movedCtx).toEqual<ParseContext>({
      ...ctx,
      index: 10,
      column: 1,
      line: 2,
    })
  })
  it("should move context on multiple lines", function () {
    const ctx = buildContext()
    const node = makeNode(ctx, NodeKind.String, {
      text: "some text\r\nabc\ndef",
    })
    const movedCtx = moved(ctx, node)

    expect(movedCtx).toEqual<ParseContext>({
      ...ctx,
      index: 18,
      column: 4,
      line: 3,
    })
  })
})

describe("updateContext", function () {
  it("should move and mutate context", function () {
    const ctx = buildContext()
    const node = makeNode(ctx, NodeKind.String, { text: "abc" })
    updateContext(ctx, node)

    expect(ctx).toEqual<ParseContext>({
      ...ctx,
      column: 4,
    })
  })
})

describe("peekEOF", function () {
  it("should return null if not on EOF", function () {
    const ctx = buildContext({ template: "abc" })
    const eof = peekEOF(ctx)

    expect(eof).toBeNull()
  })
  it("should return EOFNode if on EOF", function () {
    const ctx = buildContext({ template: "abc", index: 3, line: 1, column: 4 })
    const eof = peekEOF(ctx)

    expect(eof).toEqual<EOFNode>({
      kind: NodeKind.EOF,
      text: "",
      index: 3,
      line: 1,
      column: 4,
      length: 0,
    })
  })
})

describe("peekChar", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekChar(ctx)

    expect(node).toBeNull()
  })
  it("should return the next CharacterNode", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekChar(ctx)

    expect(node).toEqual<CharacterNode>({
      kind: NodeKind.Character,
      text: "a",
      index: 0,
      column: 1,
      line: 1,
      length: 1,
    })
  })
  it("should return null if the next CharacterNode does not match", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekChar(ctx, "b")

    expect(node).toBeNull()
  })
  it("should return the next CharacterNode if it matches", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekChar(ctx, "a")

    expect(node).toEqual<CharacterNode>({
      kind: NodeKind.Character,
      text: "a",
      index: 0,
      column: 1,
      line: 1,
      length: 1,
    })
  })
})

describe("peekAnyOf", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekAnyOf(ctx, "a", "b", "c")

    expect(node).toBeNull()
  })

  it("should return null if next CharacterNode does not match", function () {
    const ctx = buildContext({ template: "_ab" })
    const node = peekAnyOf(ctx, "a", "b", "c")

    expect(node).toBeNull()
  })
  it("should return next CharacterNode if it matches", function () {
    const ctx = buildContext({ template: "bac" })
    const node = peekAnyOf(ctx, "a", "b", "c")

    expect(node).toEqual<CharacterNode>({
      kind: NodeKind.Character,
      text: "b",
      index: 0,
      column: 1,
      line: 1,
      length: 1,
    })
  })
})

describe("peekMany", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekMany(ctx, "a", "b", "c")

    expect(node).toBeNull()
  })
  it("should return null if next CharacterNode does not match", function () {
    const ctx = buildContext({ template: "_abc" })
    const node = peekMany(ctx, "a", "b", "c")

    expect(node).toBeNull()
  })
  it("should return single character StringNode if it matches", function () {
    const ctx = buildContext({ template: "a_bc" })
    const node = peekMany(ctx, "a", "b", "c")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "a",
      index: 0,
      column: 1,
      line: 1,
      length: 1,
    })
  })
  it("should return multiple characters StringNode if it matches", function () {
    const ctx = buildContext({ template: "abcbac_ab" })
    const node = peekMany(ctx, "a", "b", "c")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "abcbac",
      index: 0,
      column: 1,
      line: 1,
      length: 6,
    })
  })
  it("should peek until EOF", function () {
    const ctx = buildContext({ template: "abcbac" })
    const node = peekMany(ctx, "a", "b", "c")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "abcbac",
      index: 0,
      column: 1,
      line: 1,
      length: 6,
    })
  })
})

describe("peekString", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekString(ctx, "a")

    expect(node).toBeNull()
  })

  it("should return null if next CharacterNode does not match", function () {
    const ctx = buildContext({ template: "_abc" })
    const node = peekString(ctx, "abc")

    expect(node).toBeNull()
  })
  it("should return null if some CharacterNode does not match", function () {
    const ctx = buildContext({ template: "ab_c" })
    const node = peekString(ctx, "abc")

    expect(node).toBeNull()
  })
  it("should return StringNode if all CharacterNodes match", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekString(ctx, "abc")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "abc",
      index: 0,
      line: 1,
      column: 1,
      length: 3,
    })
  })
})

describe("peekUntil", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekUntil(ctx, "ab")

    expect(node).toBeNull()
  })
  it("should return null if search string does not match", function () {
    const ctx = buildContext({ template: "____a" })
    const node = peekUntil(ctx, "ab")

    expect(node).toBeNull()
  })
  it("should return empty text StringNode if next string is the search string", function () {
    const ctx = buildContext({ template: "ab__" })
    const node = peekUntil(ctx, "ab")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "",
      index: 0,
      line: 1,
      column: 1,
      length: 0,
    })
  })
  it("should return StringNode with all text up until search string if it matches", function () {
    const ctx = buildContext({ template: "____ab_" })
    const node = peekUntil(ctx, "ab")

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "____",
      index: 0,
      line: 1,
      column: 1,
      length: 4,
    })
  })
})

describe("peekIndentation", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekIndentation(ctx)

    expect(node).toBeNull()
  })
  it("should return null if not at the first column", function () {
    const ctx = buildContext({ template: "  abc", column: 2, index: 1 })
    const node = peekIndentation(ctx)

    expect(node).toBeNull()
  })
  it("should return null if no space is found at the first column", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekIndentation(ctx)

    expect(node).toBeNull()
  })
  it("should return next IndentationNode with single space", function () {
    const ctx = buildContext({ template: "\tabc" })
    const node = peekIndentation(ctx)

    expect(node).toEqual<IndentationNode>({
      kind: NodeKind.Indentation,
      text: "\t",
      index: 0,
      column: 1,
      line: 1,
      length: 1,
    })
  })
  it("should return next IndentationNode with all spaces up until a non space character", function () {
    const ctx = buildContext({ template: "  \t\tabc" })
    const node = peekIndentation(ctx)

    expect(node).toEqual<IndentationNode>({
      kind: NodeKind.Indentation,
      text: "  \t\t",
      index: 0,
      column: 1,
      line: 1,
      length: 4,
    })
  })
})

describe("peekLineBreak", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekLineBreak(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not a line break", function () {
    const ctx = buildContext({ template: "abc" })
    const node = peekLineBreak(ctx)

    expect(node).toBeNull()
  })
  it("should return LineBreakNode if next string is \\n", function () {
    const ctx = buildContext({ template: "\nabc" })
    const node = peekLineBreak(ctx)

    expect(node).toEqual<LineBreakNode>({
      kind: NodeKind.LineBreak,
      text: "\n",
      index: 0,
      line: 1,
      column: 1,
      length: 1,
    })
  })
  it("should return LineBreakNode if next string is \\r\\n", function () {
    const ctx = buildContext({ template: "\r\nabc" })
    const node = peekLineBreak(ctx)

    expect(node).toEqual<LineBreakNode>({
      kind: NodeKind.LineBreak,
      text: "\r\n",
      index: 0,
      line: 1,
      column: 1,
      length: 2,
    })
  })
  it("should return LineBreakNode if next string is \\r", function () {
    const ctx = buildContext({ template: "\rabc" })
    const node = peekLineBreak(ctx)

    expect(node).toEqual<LineBreakNode>({
      kind: NodeKind.LineBreak,
      text: "\r",
      index: 0,
      line: 1,
      column: 1,
      length: 1,
    })
  })
})

describe("peekInterpolationOpen", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekInterpolationOpen(ctx)

    expect(node).toBeNull()
  })

  it("shouls return null if next string is not __", function () {
    const ctx = buildContext({ template: "a__" })
    const node = peekInterpolationOpen(ctx)

    expect(node).toBeNull()
  })
  it("shouls return InterpolationOpenNode if next string is __", function () {
    const ctx = buildContext({ template: "__a" })
    const node = peekInterpolationOpen(ctx)

    expect(node).toEqual<InterpolationOpenNode>({
      kind: NodeKind.InterpolationOpen,
      text: "__",
      index: 0,
      column: 1,
      line: 1,
      length: 2,
    })
  })
})

describe("peekInterpolationClose", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekInterpolationClose(ctx)

    expect(node).toBeNull()
  })

  it("shouls return null if next string is not __", function () {
    const ctx = buildContext({ template: "a__" })
    const node = peekInterpolationClose(ctx)

    expect(node).toBeNull()
  })
  it("shouls return InterpolationOpenNode if next string is __", function () {
    const ctx = buildContext({ template: "__a" })
    const node = peekInterpolationClose(ctx)

    expect(node).toEqual<InterpolationCloseNode>({
      kind: NodeKind.InterpolationClose,
      text: "__",
      index: 0,
      column: 1,
      line: 1,
      length: 2,
    })
  })
})

describe("peekInterpolation", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekInterpolation(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not __", function () {
    const ctx = buildContext({ template: "ab__" })
    const node = peekInterpolation(ctx)

    expect(node).toBeNull()
  })
  it("should throw an Error if InterpolationCloseNode is not found", function () {
    const ctx = buildContext({ template: "__abc_" })

    expect(() => peekInterpolation(ctx)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Open interpolation __ on line 1 column 1 is not closed. Did you forget to add a __ ?]`,
    )
  })
  it("should throw an Error if InterpolationExpressionNode is empty", function () {
    const ctx = buildContext({ template: "__ __" })

    expect(() => peekInterpolation(ctx)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Interpolation expression __ on line 1 column 1 is empty.]`,
    )
  })
  it("should return InterpolationNode if all matches correctly", function () {
    const ctx = buildContext({ template: "__abc__" })
    const node = peekInterpolation(ctx)

    expect(node).toEqual<InterpolationNode>({
      kind: NodeKind.Interpolation,
      text: "__abc__",
      index: 0,
      line: 1,
      column: 1,
      length: 7,
      open: {
        kind: NodeKind.InterpolationOpen,
        text: "__",
        index: 0,
        line: 1,
        column: 1,
        length: 2,
      },
      expression: {
        kind: NodeKind.InterpolationExpression,
        text: "abc",
        index: 2,
        line: 1,
        column: 3,
        length: 3,
      },
      close: {
        kind: NodeKind.InterpolationClose,
        text: "__",
        index: 5,
        column: 6,
        line: 1,
        length: 2,
      },
    })
  })
})

describe("peekCommentMarker", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekCommentMarker(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not a # or a //", function () {
    const ctx = buildContext({ template: "/#" })
    const node = peekCommentMarker(ctx)

    expect(node).toBeNull()
  })
  it("should return StringNode if it is a #", function () {
    const ctx = buildContext({ template: "#//" })
    const node = peekCommentMarker(ctx)

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "#",
      index: 0,
      line: 1,
      column: 1,
      length: 1,
    })
  })
  it("should return StringNode if it is a //", function () {
    const ctx = buildContext({ template: "//#" })
    const node = peekCommentMarker(ctx)

    expect(node).toEqual<StringNode>({
      kind: NodeKind.String,
      text: "//",
      index: 0,
      line: 1,
      column: 1,
      length: 2,
    })
  })
})

describe("peekRepeatBlockOpen", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekRepeatBlockOpen(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not a line break and is not the begin of file", function () {
    const ctx = buildContext({ template: "a//<", index: 1, line: 1, column: 2 })
    const node = peekRepeatBlockOpen(ctx)

    expect(node).toBeNull()
  })
  it("should return RepeatBlockOpenNode if next string is a valid marker and is the begin of file", function () {
    const ctx = buildContext({ template: "//<\n" })
    const node = peekRepeatBlockOpen(ctx)

    expect(node).toEqual<RepeatBlockOpenNode>({
      kind: NodeKind.RepeatBlockOpen,
      text: "//<",
      index: 0,
      line: 1,
      column: 1,
      length: 3,
      commentMarker: {
        kind: NodeKind.String,
        text: "//",
        index: 0,
        line: 1,
        column: 1,
        length: 2,
      },
    })
  })
  describe("without indentation", function () {
    it("should return null if after line break there is no comment marker", function () {
      const ctx = buildContext({ template: "\na//<\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toBeNull()
    })
    it("should return null if after comment marker there is no <", function () {
      const ctx = buildContext({ template: "\n//_\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toBeNull()
    })
    it("should throw an Error if after the whole marker ther is no line break", function () {
      const ctx = buildContext({ template: "\n//<a" })
      expect(() => peekRepeatBlockOpen(ctx)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Open repeat block //< on line 2 column 1 must be followed by a line break.]`,
      )
    })
    it("should return RepeatBlockOpenNode if next string is a valid marker delimited by 2 line breaks", function () {
      const ctx = buildContext({ template: "\n//<\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toEqual<RepeatBlockOpenNode>({
        kind: NodeKind.RepeatBlockOpen,
        text: "\n//<",
        index: 0,
        line: 1,
        column: 1,
        length: 4,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 1,
          line: 2,
          column: 1,
          length: 2,
        },
      })
    })
  })
  describe("with indentation", function () {
    it("should return null if after line break there is no comment marker", function () {
      const ctx = buildContext({ template: "\n  a//<\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toBeNull()
    })
    it("should return null if after comment marker there is no <", function () {
      const ctx = buildContext({ template: "\n  //_\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toBeNull()
    })
    it("should throw an Error if after the whole marker ther is no line break", function () {
      const ctx = buildContext({ template: "\n  //<a" })
      expect(() => peekRepeatBlockOpen(ctx)).toThrowErrorMatchingInlineSnapshot(
        `[Error: Open repeat block //< on line 2 column 3 must be followed by a line break.]`,
      )
    })
    it("should return RepeatBlockOpenNode if next string is a valid marker delimited by 2 line breaks", function () {
      const ctx = buildContext({ template: "\n  //<\n" })
      const node = peekRepeatBlockOpen(ctx)

      expect(node).toEqual<RepeatBlockOpenNode>({
        kind: NodeKind.RepeatBlockOpen,
        text: "\n  //<",
        index: 0,
        line: 1,
        column: 1,
        length: 6,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 3,
          line: 2,
          column: 3,
          length: 2,
        },
      })
    })
  })
})

describe("peekRepeatBlockClose", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "", insideRepeatBlock: true })
    const node = peekRepeatBlockClose(ctx)

    expect(node).toBeNull()
  })
  it("should return null if not inside RepeatBlock context", function () {
    const ctx = buildContext({ template: "\n//>\n", insideRepeatBlock: false })
    const node = peekRepeatBlockClose(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not a line break", function () {
    const ctx = buildContext({
      template: "a//>",
      index: 1,
      line: 1,
      column: 2,
      insideRepeatBlock: true,
    })
    const node = peekRepeatBlockClose(ctx)

    expect(node).toBeNull()
  })
  describe("without indentation", function () {
    it("should return null if after line break there is no comment marker", function () {
      const ctx = buildContext({
        template: "\na//>\n",
        insideRepeatBlock: true,
      })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toBeNull()
    })
    it("should return null if after comment marker there is no >", function () {
      const ctx = buildContext({ template: "\n//_\n", insideRepeatBlock: true })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toBeNull()
    })
    it("should throw an Error if after the whole marker ther is no line break", function () {
      const ctx = buildContext({ template: "\n//>a", insideRepeatBlock: true })
      expect(() =>
        peekRepeatBlockClose(ctx),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Close repeat block //> on line 2 column 1 must be followed by a line break or EOF.]`,
      )
    })
    it("should return RepeatBlockCloseNode if next string is a valid marker delimited by 2 line breaks", function () {
      const ctx = buildContext({ template: "\n//>\n", insideRepeatBlock: true })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toEqual<RepeatBlockCloseNode>({
        kind: NodeKind.RepeatBlockClose,
        text: "\n//>",
        index: 0,
        line: 1,
        column: 1,
        length: 4,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 1,
          line: 2,
          column: 1,
          length: 2,
        },
      })
    })
    it("should return RepeatBlockCloseNode if next string is a valid marker delimited by a line break and an EOF", function () {
      const ctx = buildContext({ template: "\n//>", insideRepeatBlock: true })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toEqual<RepeatBlockCloseNode>({
        kind: NodeKind.RepeatBlockClose,
        text: "\n//>",
        index: 0,
        line: 1,
        column: 1,
        length: 4,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 1,
          line: 2,
          column: 1,
          length: 2,
        },
      })
    })
  })
  describe("with indentation", function () {
    it("should return null if after line break there is no comment marker", function () {
      const ctx = buildContext({
        template: "\n  a//>\n",
        insideRepeatBlock: true,
      })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toBeNull()
    })
    it("should return null if after comment marker there is no >", function () {
      const ctx = buildContext({
        template: "\n  //_\n",
        insideRepeatBlock: true,
      })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toBeNull()
    })
    it("should throw an Error if after the whole marker ther is no line break", function () {
      const ctx = buildContext({
        template: "\n  //>a",
        insideRepeatBlock: true,
      })
      expect(() =>
        peekRepeatBlockClose(ctx),
      ).toThrowErrorMatchingInlineSnapshot(
        `[Error: Close repeat block //> on line 2 column 3 must be followed by a line break or EOF.]`,
      )
    })
    it("should return RepeatBlockCloseNode if next string is a valid marker delimited by 2 line breaks", function () {
      const ctx = buildContext({
        template: "\n  //>\n",
        insideRepeatBlock: true,
      })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toEqual<RepeatBlockCloseNode>({
        kind: NodeKind.RepeatBlockClose,
        text: "\n  //>",
        index: 0,
        line: 1,
        column: 1,
        length: 6,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 3,
          line: 2,
          column: 3,
          length: 2,
        },
      })
    })
    it("should return RepeatBlockCloseNode if next string is a valid marker delimited by a line break and an EOF", function () {
      const ctx = buildContext({
        template: "\n  //>",
        insideRepeatBlock: true,
      })
      const node = peekRepeatBlockClose(ctx)

      expect(node).toEqual<RepeatBlockCloseNode>({
        kind: NodeKind.RepeatBlockClose,
        text: "\n  //>",
        index: 0,
        line: 1,
        column: 1,
        length: 6,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 3,
          line: 2,
          column: 3,
          length: 2,
        },
      })
    })
  })
})

describe("peekRepeatBlock", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekRepeatBlock(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is not an repeat block open marker", function () {
    const ctx = buildContext({ template: "a//<", index: 1, line: 1, column: 2 })
    const node = peekRepeatBlock(ctx)

    expect(node).toBeNull()
  })
  it("should throw an Error if repeat block does not close", function () {
    const ctx = buildContext({ template: "//<\nabc = __def__//>" })

    expect(() => peekRepeatBlock(ctx)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Open repeat block //< on line 1 column 1 is not closed. Did you forget to add a //> ?]`,
    )
  })
  it("should throw an Error if repeat block does not contain interpolation", function () {
    const ctx = buildContext({
      template: `
//<
abc = def
//>`,
    })
    expect(() => peekRepeatBlock(ctx)).toThrowErrorMatchingInlineSnapshot(
      `[Error: Repeat block on line 1 column 1 must have at least 1 interpolation.]`,
    )
  })
  it("should return RepeatBlockNode with children", function () {
    const ctx = buildContext({
      template: `
//<
abc = __def__
//>`.replaceAll("\r\n", "\n"), // this makes testing easier and OS agnostic
    })
    const node = peekRepeatBlock(ctx)

    expect(node).toEqual<RepeatBlockNode>({
      kind: NodeKind.RepeatBlock,
      text: `
//<
abc = __def__
//>`.replaceAll("\r\n", "\n"),
      index: 0,
      line: 1,
      column: 1,
      length: 22,
      open: {
        kind: NodeKind.RepeatBlockOpen,
        text: `\n//<`,
        index: 0,
        line: 1,
        column: 1,
        length: 4,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 1,
          line: 2,
          column: 1,
          length: 2,
        },
      },
      nodes: [
        expect.objectContaining<Partial<LineBreakNode>>({
          kind: NodeKind.LineBreak,
          text: "\n",
        }) as LineBreakNode,
        expect.objectContaining<Partial<ConstantNode>>({
          kind: NodeKind.Constant,
          text: "abc = ",
        }) as ConstantNode,
        expect.objectContaining<Partial<InterpolationNode>>({
          kind: NodeKind.Interpolation,
          text: "__def__",
        }) as InterpolationNode,
      ],
      close: {
        kind: NodeKind.RepeatBlockClose,
        text: `\n//>`,
        index: 18,
        line: 3,
        column: 14,
        length: 4,
        commentMarker: {
          kind: NodeKind.String,
          text: "//",
          index: 19,
          line: 4,
          column: 1,
          length: 2,
        },
      },
    })
  })
})

describe("peekConstant", function () {
  it("should return null on EOF", function () {
    const ctx = buildContext({ template: "" })
    const node = peekConstant(ctx)

    expect(node).toBeNull()
  })
  it("should return null if next string is a syntax marker", function () {
    const ctx = buildContext({ template: "__abc__" })
    const node = peekConstant(ctx)

    expect(node).toBeNull()
  })
  it("should return ConstantNode with whole text until next syntax marker", function () {
    const ctx = buildContext({ template: "abc = def\n" })
    const node = peekConstant(ctx)

    expect(node).toEqual<ConstantNode>({
      kind: NodeKind.Constant,
      text: "abc = def",
      index: 0,
      line: 1,
      column: 1,
      length: 9,
    })
  })
})

describe("parseTemplate", function () {
  test("general case", function () {
    const nodes = parseTemplate(`const endpoints = {
  //<
  __namespace__: {
    //<
    __action__: __action__Handler,
    //>
  },
  //>
}`)
    expect(nodes).toEqual<Node[]>([
      partialMatch({
        kind: NodeKind.Constant,
        text: "const endpoints = {",
      }),
      partialMatch({
        kind: NodeKind.RepeatBlock,
        text: `
  //<
  __namespace__: {
    //<
    __action__: __action__Handler,
    //>
  },
  //>`,
        nodes: [
          partialMatch({ kind: NodeKind.LineBreak }),
          partialMatch({ kind: NodeKind.Indentation, text: "  " }),
          partialMatch({
            kind: NodeKind.Interpolation,
            expression: partialMatch<InterpolationExpressionNode>({
              kind: NodeKind.InterpolationExpression,
              text: "namespace",
            }),
          }),
          partialMatch({ kind: NodeKind.Constant, text: ": {" }),
          partialMatch({
            kind: NodeKind.RepeatBlock,
            text: `
    //<
    __action__: __action__Handler,
    //>`,
            nodes: [
              partialMatch({ kind: NodeKind.LineBreak }),
              partialMatch({ kind: NodeKind.Indentation, text: "    " }),
              partialMatch({
                kind: NodeKind.Interpolation,
                expression: partialMatch<InterpolationExpressionNode>({
                  kind: NodeKind.InterpolationExpression,
                  text: "action",
                }),
              }),
              partialMatch({ kind: NodeKind.Constant, text: ": " }),
              partialMatch({
                kind: NodeKind.Interpolation,
                expression: partialMatch<InterpolationExpressionNode>({
                  kind: NodeKind.InterpolationExpression,
                  text: "action",
                }),
              }),
              partialMatch({ kind: NodeKind.Constant, text: "Handler," }),
            ],
          }),
          partialMatch({ kind: NodeKind.LineBreak }),
          partialMatch({ kind: NodeKind.Indentation, text: "  " }),
          partialMatch({ kind: NodeKind.Constant, text: "}," }),
        ],
      }),
      partialMatch({
        kind: NodeKind.LineBreak,
      }),
      partialMatch({
        kind: NodeKind.Constant,
        text: "}",
      }),
    ])
  })
})

function partialMatch<TNode extends Node>(values: Partial<TNode>) {
  return expect.objectContaining(values) as TNode
}

function buildContext(props: Partial<ParseContext> = {}) {
  const ctx: ParseContext = {
    index: 0,
    column: 1,
    line: 1,
    template: "",
    insideRepeatBlock: false,
    ...props,
  }
  return ctx
}
