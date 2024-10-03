import { names, Tree } from "@nx/devkit"
import assert from "node:assert"
import path from "path"
import { Project, SyntaxKind } from "ts-morph"
import type { EndpointGeneratorOptions } from "./schema.d.ts"

export function generateServer(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  generateEndpointFile(tree, root, options)
  generateEndpointDeclaration(tree, root, options)
  generateTestFile(tree, root, options)
}

function generateEndpointFile(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const { className: operationNamePascalCase } = names(options.operationName)
  const content = `import {
  ${operationNamePascalCase}InputSchema,
  ${operationNamePascalCase}OutputSchema,
  api,
} from "@prigas/server.api"
import { Ok } from "libs.result"
import { z } from "zod"
import { logger } from "../../lib/logger.js"
import { routeHandler } from "../../lib/route-handler.js"

export type ${operationNamePascalCase}HandlerInput = z.output<typeof ${operationNamePascalCase}InputSchema>
export type ${operationNamePascalCase}HandlerOutput = z.input<typeof ${operationNamePascalCase}OutputSchema>
export async function ${options.operationName}Handler(
  input: ${operationNamePascalCase}HandlerInput,
): Promise<${operationNamePascalCase}HandlerOutput> {
  logger.info("${options.operationName}", input)
  return Ok({})
}

export const ${options.operationName} = routeHandler<
  typeof api.${options.namespace}.${options.operationName}
>(${options.operationName}Handler)
`
  tree.write(
    path.join(
      root,
      "src",
      "endpoints",
      options.namespace,
      `${options.operationName}.ts`,
    ),
    content,
  )
}

function generateEndpointDeclaration(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const mainTsPath = path.join(root, "src", "main.ts")
  const mainTsContent = tree.read(mainTsPath, "utf-8")
  assert(mainTsContent, "main.ts file not found")
  const project = new Project()
  const mainTsSource = project.createSourceFile("main.ts", mainTsContent)

  mainTsSource.addImportDeclaration({
    moduleSpecifier: `./endpoints/${options.namespace}/${options.operationName}.js`,
    namedImports: [options.operationName],
  })

  const routerVariable = mainTsSource.getVariableDeclaration("router")
  assert(routerVariable, "No 'router' variable was found")
  const routerCall = routerVariable.getInitializerIfKind(
    SyntaxKind.CallExpression,
  )
  assert(
    routerCall,
    "Variable router was found, but it was not assigned to a router call",
  )
  const routerArguments = routerCall.getArguments()
  const secondArgument = routerArguments[1]
  assert(secondArgument, "router call should have at least 2 argument")
  const routerEndpoints = secondArgument.asKind(
    SyntaxKind.ObjectLiteralExpression,
  )
  assert(
    routerEndpoints,
    "router call second argument should be an object literal",
  )

  let namespaceProperty = routerEndpoints
    .getProperty(options.namespace)
    ?.asKind(SyntaxKind.PropertyAssignment)
  if (namespaceProperty == null) {
    namespaceProperty = routerEndpoints.addPropertyAssignment({
      name: options.namespace,
      initializer: "{}",
    })
  }

  const namespaceOperations = namespaceProperty.getInitializerIfKind(
    SyntaxKind.ObjectLiteralExpression,
  )
  assert(
    namespaceOperations,
    `${options.namespace} operations should be an object literal`,
  )

  namespaceOperations.addPropertyAssignment({
    name: options.operationName,
    initializer: options.operationName,
  })

  tree.write(mainTsPath, mainTsSource.getFullText())
}

function generateTestFile(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const { className: operationNamePascalCase } = names(options.operationName)
  const content = `import { ${operationNamePascalCase}Input } from "@prigas/server.api"
import { ${options.operationName}Handler, ${options.operationName}HandlerInput } from "./${options.operationName}.js"

describe("${options.operationName}", function() {
  it("should work with valid input", async function() {
    const input: ${operationNamePascalCase}HandlerInput = {}
    const [output, err] = await ${options.operationName}Handler(input)
    
    expect(err).toBeUndefined()
    expect(output).not.toBeUndefined()
  })
})
`
  tree.write(
    path.join(
      root,
      "src",
      "endpoints",
      options.namespace,
      `${options.operationName}.test.ts`,
    ),
    content,
  )
}
