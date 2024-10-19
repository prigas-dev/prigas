import { generate, mapModel, mergeModel, Model } from "./generator.js"
import { parseTemplate } from "./template-parser.js"

describe("mapModel", function () {
  it("should work with simple interpolation", function () {
    const templateString = `aa __somekey__ bb`
    const template = parseTemplate(templateString)
    const source = `aaabcbb`

    const model = mapModel(source, template.nodes)
    expect(model).toEqual<Model>({
      start: 0,
      end: 7,
      repeatBlocks: [],
      interpolations: {
        somekey: "abc",
      },
    })
  })

  it("should work with simple repeat block", function () {
    const templateString = `
start:
    #<
    __somekey__: __somevalue__ #
    #>
end:`
    const template = parseTemplate(templateString)
    const source = `
start:
    a: atext #
    b: btext #
end:
`
    const model = mapModel(source, template.nodes)
    expect(model).toEqual<Model>({
      start: 0,
      end: 26,
      repeatBlocks: [
        {
          blocks: [
            {
              start: 6,
              end: 14,
              interpolations: {
                somekey: "a",
                somevalue: "atext",
              },
              repeatBlocks: [],
            },
            {
              start: 14,
              end: 22,
              interpolations: {
                somekey: "b",
                somevalue: "btext",
              },
              repeatBlocks: [],
            },
          ],
        },
      ],
      interpolations: {},
    })
  })

  it("should work with nested repeat blocks", function () {
    const templateString = `
export const routes = {
  //<
  __namespace__: {
    //<
    __operationName__: __operationName__Handler,
    //>
  },
  //>
},`
    const template = parseTemplate(templateString)

    const source = `
export const routes = {
    projects: {
      addProject: addProjectHandler,
      removeProject: removeProjectHandler,
    },
    users: {
      addUser: addUserHandler,
    },
},
`
    const model = mapModel(source, template.nodes)

    expect(model).toEqual<Model>({
      start: 0,
      end: 129,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 19,
              end: 95,
              interpolations: {
                namespace: "projects",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 29,
                      end: 58,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addProject",
                      },
                    },
                    {
                      start: 58,
                      end: 93,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "removeProject",
                      },
                    },
                  ],
                },
              ],
            },
            {
              start: 95,
              end: 127,
              interpolations: {
                namespace: "users",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 102,
                      end: 125,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addUser",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("should work with multiple repeat blocks", function () {
    const templateString = `
---
//<
__somekey__,
//>
---
//<
__somekey__,
//>
---
`
    const template = parseTemplate(templateString)

    const source = `
---
abc,
---
def,
---
`
    const model = mapModel(source, template.nodes)

    expect(model).toEqual<Model>({
      start: 0,
      end: 17,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 3,
              end: 7,
              repeatBlocks: [],
              interpolations: {
                somekey: "abc",
              },
            },
          ],
        },
        {
          blocks: [
            {
              start: 10,
              end: 14,
              repeatBlocks: [],
              interpolations: {
                somekey: "def",
              },
            },
          ],
        },
      ],
    })
  })
})

describe("mergeModel", function () {
  it("should work with simple interpolation", function () {
    const templateString = `aa __somekey__ bb`
    const template = parseTemplate(templateString)

    const model: Model = {
      start: 0,
      end: 0,
      repeatBlocks: [],
      interpolations: {
        somekey: "123",
      },
    }

    mergeModel({ somekey: "456" }, model, template.nodes)

    expect(model).toEqual<Model>({
      start: 0,
      end: 0,
      repeatBlocks: [],
      interpolations: {
        somekey: "456",
      },
    })
  })

  it("should work with simple repeat block", function () {
    const templateString = `
start:
    #<
    __somekey__: __somevalue__ #
    #>
end:`
    const template = parseTemplate(templateString)

    const model: Model = {
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "a",
                somevalue: "atext",
              },
            },
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "b",
                somevalue: "btext",
              },
            },
          ],
        },
      ],
    }

    mergeModel({ somekey: "b", somevalue: "ctext" }, model, template.nodes)

    expect(model).toEqual<Model>({
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "a",
                somevalue: "atext",
              },
            },
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "b",
                somevalue: "btext",
              },
            },
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "b",
                somevalue: "ctext",
              },
            },
          ],
        },
      ],
    })
  })

  it("should work with nested repeat blocks", function () {
    const templateString = `
export const routes = {
  //<
  __namespace__: {
    //<
    __operationName__: __operationName__Handler,
    //>
  },
  //>
},`
    const template = parseTemplate(templateString)

    const model: Model = {
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              interpolations: {
                namespace: "projects",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addProject",
                      },
                    },
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "removeProject",
                      },
                    },
                  ],
                },
              ],
            },
            {
              start: 0,
              end: 0,
              interpolations: {
                namespace: "users",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addUser",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    }

    mergeModel(
      { namespace: "users", operationName: "removeUser" },
      model,
      template.nodes,
    )

    expect(model).toEqual<Model>({
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              interpolations: {
                namespace: "projects",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addProject",
                      },
                    },
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "removeProject",
                      },
                    },
                  ],
                },
              ],
            },
            {
              start: 0,
              end: 0,
              interpolations: {
                namespace: "users",
              },
              repeatBlocks: [
                {
                  blocks: [
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "addUser",
                      },
                    },
                    {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationName: "removeUser",
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    })
  })

  it("should work with multiple repeat blocks", function () {
    const templateString = `
---
//<
__somekey__,
//>
---
//<
__somekey__,
//>
---
`
    const template = parseTemplate(templateString)

    const model: Model = {
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "abc",
              },
            },
          ],
        },
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "def",
              },
            },
          ],
        },
      ],
    }

    mergeModel({ somekey: "abc" }, model, template.nodes)

    expect(model).toEqual<Model>({
      start: 0,
      end: 0,
      interpolations: {},
      repeatBlocks: [
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "abc",
              },
            },
          ],
        },
        {
          blocks: [
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "def",
              },
            },
            {
              start: 0,
              end: 0,
              repeatBlocks: [],
              interpolations: {
                somekey: "abc",
              },
            },
          ],
        },
      ],
    })
  })
})

describe("generate", function () {
  it("should work with simple interpolation", function () {
    const templateString = `aa __somekey__ bb`
    const source = `aaabcbb`

    const result = generate(source, templateString, { somekey: "def" })

    expect(result).toEqual(`aa def bb`)
  })

  it("should work with simple repeat block", function () {
    const templateString = `
start:
    #<
    __somekey__: __somevalue__ #
    #>
end:`
    const source = `
start:
    a: atext#
    b:btext#
end:
`
    const result = generate(source, templateString, {
      somekey: "b",
      somevalue: "ctext",
    })

    expect(result).toEqual(`
start:
    a: atext #
    b: btext #
    b: ctext #
end:`)
  })

  it("should work with nested repeat blocks", function () {
    const templateString = `
export const routes = {
  //<
  __namespace__: {
    //<
    __operationName__: __operationName__Handler,
    //>
  },
  //>
},`
    const source = `
export const routes = {
    projects: {
      addProject: addProjectHandler,
      removeProject: removeProjectHandler,
    },
    users: {
      addUser: addUserHandler,
    },
},
`
    const result = generate(source, templateString, {
      namespace: "users",
      operationName: "removeUser",
    })

    expect(result).toEqual(`
export const routes = {
  projects: {
    addProject: addProjectHandler,
    removeProject: removeProjectHandler,
  },
  users: {
    addUser: addUserHandler,
    removeUser: removeUserHandler,
  },
},`)
  })

  it("should work with multiple repeat blocks", function () {
    const templateString = `
---
//<
__somekey__,
//>
---
//<
__somekey__,
//>
---
`
    const source = `
---
abc,
---
def,
---
`
    const result = generate(source, templateString, { somekey: "abc" })

    expect(result).toEqual(`
---
abc,
---
def,
abc,
---
`)
  })
})
