import { logger, names, Tree } from "@nx/devkit"
import assert from "node:assert"
import path from "node:path"
import { Project, SyntaxKind } from "ts-morph"
import type { EndpointGeneratorOptions } from "./schema.d.ts"

export function generateApi(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  generateEndpointFile(tree, root, options)
  generateSchemasExport(tree, root, options)
  generateEndpointDeclaration(tree, root, options)
}

function generateEndpointFile(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const { className: operationNamePascalCase } = names(options.operationName)

  const content = `import { initContract } from "@ts-rest/core"
import { DefaultErrorSchema, result } from "libs.result"
import { z } from "zod"

const c = initContract()

export const ${operationNamePascalCase}InputSchema = z.object({})
export type ${operationNamePascalCase}Input = z.input<
  typeof ${operationNamePascalCase}InputSchema
>

export const ${operationNamePascalCase}OutputSchema = result(z.object({}), DefaultErrorSchema)
export type ${operationNamePascalCase}Output = z.output<
  typeof ${operationNamePascalCase}OutputSchema
>

export const ${options.operationName} = c.${options.operationType}({
  method: "${options.operationType === "mutation" ? "POST" : "GET"}",
  path: "/${options.namespace}/${options.operationName}",
  ${options.operationType === "mutation" ? "body" : "query"}: ${operationNamePascalCase}InputSchema,
  responses: {
    200: ${operationNamePascalCase}OutputSchema,
  },
})
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

function generateSchemasExport(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const schemasTsPath = path.join(root, "src", "schemas.ts")
  logger.info(schemasTsPath)
  const schemasTsContent = tree.read(schemasTsPath, "utf-8")
  assert(schemasTsContent != null, "schemas.ts file not found")
  const project = new Project()
  const schemasSource = project.createSourceFile("schema.ts", schemasTsContent)

  const { className: operationNamePascalCase } = names(options.operationName)
  schemasSource.addExportDeclaration({
    moduleSpecifier: `./endpoints/${options.namespace}/${options.operationName}.js`,
    namedExports: [
      `${operationNamePascalCase}InputSchema`,
      `${operationNamePascalCase}OutputSchema`,
      {
        name: `${operationNamePascalCase}Input`,
        isTypeOnly: true,
      },
      {
        name: `${operationNamePascalCase}Output`,
        isTypeOnly: true,
      },
    ],
  })

  tree.write(schemasTsPath, schemasSource.getFullText())
}

function generateEndpointDeclaration(
  tree: Tree,
  root: string,
  options: EndpointGeneratorOptions,
) {
  const indexTsPath = path.join(root, "src", "index.ts")
  const indexTsContent = tree.read(indexTsPath, "utf-8")
  assert(indexTsContent, "index.ts file not found")
  const project = new Project()
  const indexTsSource = project.createSourceFile("index.ts", indexTsContent)

  indexTsSource.addImportDeclaration({
    moduleSpecifier: `./endpoints/${options.namespace}/${options.operationName}.js`,
    namedImports: [options.operationName],
  })

  const apiVariable = indexTsSource.getVariableDeclaration("api")
  assert(apiVariable, "No 'api' variable was found")
  const routerCall = apiVariable.getInitializerIfKind(SyntaxKind.CallExpression)
  assert(
    routerCall,
    "Variable api was found, but it was not assigned to a router call",
  )
  const routerArguments = routerCall.getArguments()
  const firstArgument = routerArguments[0]
  assert(firstArgument, "router call should have at least 1 argument")
  const routerEndpoints = firstArgument.asKind(
    SyntaxKind.ObjectLiteralExpression,
  )
  assert(
    routerEndpoints,
    "router call first argument should be an object literal",
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

  tree.write(indexTsPath, indexTsSource.getFullText())
}
