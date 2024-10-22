import assert from "node:assert"
import path from "node:path"
import { ClassDeclaration, MethodDeclaration, Project, Type } from "ts-morph"
import { getTypeName } from "./ts-morph.js"

export interface OperationHandler {
  class: ClassDeclaration
  method: MethodDeclaration
  modulePath: string
  input: TypeDefinition
  output: TypeDefinition
}
export interface TypeDefinition {
  name: string
  type: Type
}
export interface GetOperationHandlersOptions {
  projectRoot: string
  /**
   * relative to projectRoot, defaults to tsconfig.app.json
   */
  tsConfigPath?: string
  /**
   * relative to projectRoot, defaults to src/operations
   */
  operationsPath?: string
}
export function getOperationHandlers({
  projectRoot,
  tsConfigPath = "tsconfig.app.json",
  operationsPath = "src/operations",
}: GetOperationHandlersOptions) {
  const tsConfigFullPath = path.join(projectRoot, tsConfigPath)

  const project = new Project({
    tsConfigFilePath: tsConfigFullPath,
  })

  const operationsFolderPath = path.join(projectRoot, operationsPath)

  const operationsFolder = project.getDirectoryOrThrow(operationsFolderPath)
  const operationSourceFiles = operationsFolder.getDescendantSourceFiles()

  const operationHandlers: OperationHandler[] = []

  for (const sourceFile of operationSourceFiles) {
    const handlerClass = sourceFile.getClasses().find((_class) => {
      if (!_class.isExported() || _class.getName() == null) {
        return false
      }

      const foundMethods = _class.getInstanceMethods().filter(isHandlerMethod)

      const hasSingleHandlerMethod = foundMethods.length === 1

      return hasSingleHandlerMethod
    })

    if (handlerClass == null) {
      continue
    }

    const handlerClassName = handlerClass.getName()
    assert(handlerClassName, "handler class should have name")

    const handlerMethod = handlerClass
      .getInstanceMethods()
      .find(isHandlerMethod)
    assert(handlerMethod, "handler method should not be null")

    const inputType = handlerMethod.getParameters()[0].getType()
    const outputType = handlerMethod.getReturnType().getTypeArguments()[0]

    const inputTypeName = getTypeName(inputType) ?? handlerClassName + "Input"
    const outputTypeName =
      getTypeName(outputType) ?? handlerClassName + "Output"

    const handlerDefinition: OperationHandler = {
      modulePath: sourceFile.getFilePath(),
      class: handlerClass,
      method: handlerMethod,
      input: {
        name: inputTypeName,
        type: inputType,
      },
      output: {
        name: outputTypeName,
        type: outputType,
      },
    }
    operationHandlers.push(handlerDefinition)
  }

  return operationHandlers
}

function isHandlerMethod(method: MethodDeclaration) {
  const isPublic =
    !method.hasModifier("protected") && !method.hasModifier("private")
  const isPromise = method.getReturnType().getText().startsWith("Promise")
  const has2Parameters = method.getParameters().length === 2

  return isPublic && isPromise && has2Parameters
}
