import assert from "assert"
import type { JSONSchema7 } from "json-schema"
import path from "path"
import { ClassDeclaration, MethodDeclaration, Project, Type } from "ts-morph"

const projectPath =
  "C:\\Users\\victo\\Dev\\prigas-dev\\prigas\\packages\\@prigas.sample"

const tsConfigPath = path.join(projectPath, "tsconfig.app.json")

const project = new Project({
  tsConfigFilePath: tsConfigPath,
})

const operationsFolderPath = path.join(projectPath, "src", "operations")

const operationsFolder = project.getDirectoryOrThrow(operationsFolderPath)
const operationSourceFiles = operationsFolder.getDescendantSourceFiles()

interface HandlerDefinition {
  class: ClassDeclaration
  method: MethodDeclaration
  input: TypeDefinition
  output: TypeDefinition
}
interface TypeDefinition {
  name: string
  type: Type
}
const operationHandlerDefinitions: HandlerDefinition[] = []

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

  const handlerMethod = handlerClass.getInstanceMethods().find(isHandlerMethod)
  assert(handlerMethod, "handler method should not be null")

  const inputType = handlerMethod.getParameters()[0].getType()
  const outputType = handlerMethod.getReturnType().getTypeArguments()[0]

  const inputTypeName = getTypeName(inputType) ?? handlerClassName + "Input"
  const outputTypeName = getTypeName(outputType) ?? handlerClassName + "Output"

  const handlerDefinition: HandlerDefinition = {
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
  operationHandlerDefinitions.push(handlerDefinition)
}

function isHandlerMethod(method: MethodDeclaration) {
  const isPublic =
    !method.hasModifier("protected") && !method.hasModifier("private")
  const isPromise = method.getReturnType().getText().startsWith("Promise")
  const has2Parameters = method.getParameters().length === 2

  return isPublic && isPromise && has2Parameters
}

function getTypeName(type: Type) {
  const typeSymbol = type.getAliasSymbol() ?? type.getSymbol()

  if (typeSymbol == null) {
    return null
  }

  const name = typeSymbol.getName()

  // maybe there is a better way to determine if the type has no name
  // by checking some property of the symbol
  if (name === "__object") {
    return null
  }

  return name
}

const types: Partial<Record<string, JSONSchema7>> = {}
interface Operation {
  name: string
  input: JSONSchema7
  output: JSONSchema7
}
const operations: Operation[] = []

for (const handlerDefinition of operationHandlerDefinitions) {
  const inputTypeSchema = convertTypeToJsonSchema(handlerDefinition.input.type)
  types[handlerDefinition.input.name] = inputTypeSchema
  const outputTypeSchema = convertTypeToJsonSchema(
    handlerDefinition.output.type,
  )
  types[handlerDefinition.output.name] = outputTypeSchema

  const operation: Operation = {
    name: handlerDefinition.method.getName(),
    input: {
      $ref: `#/types/${handlerDefinition.input.name}`,
    },
    output: {
      $ref: `#/types/${handlerDefinition.output.name}`,
    },
  }

  operations.push(operation)
}

const apiSchema = {
  types,
  operations,
}

// Agora o esquema é gerar informação de módulo a partir das operation
// definitions e gerar um arquivo com as rotas

console.log(apiSchema)

function convertTypeToJsonSchema(type: Type): JSONSchema7 {
  const typeName = getTypeName(type)
  if (typeName != null) {
    const cachedSchema = types[typeName]
    if (cachedSchema != null) {
      return cachedSchema
    }
  }

  let schema: JSONSchema7
  if (type.isString()) {
    schema = { type: "string" }
  } else if (type.isTemplateLiteral()) {
    schema = { type: "string" }
  } else if (type.isNumber()) {
    schema = { type: "number" }
  } else if (type.isBoolean()) {
    schema = { type: "boolean" }
  } else if (type.isNull()) {
    schema = { type: "null" }
  } else if (type.isArray()) {
    schema = {
      type: "array",
      items: convertTypeToJsonSchema(type.getArrayElementTypeOrThrow()),
    }
  } else if (type.isUnion()) {
    schema = {
      anyOf: type.getUnionTypes().map((t) => convertTypeToJsonSchema(t)),
    }
  } else if (type.isObject()) {
    const properties: JSONSchema7["properties"] = {}
    type.getProperties().forEach((prop) => {
      const propType = prop.getTypeAtLocation(prop.getDeclarations()[0])
      properties[prop.getName()] = convertTypeToJsonSchema(propType)
    })
    schema = { type: "object", properties }
  } else if (type.getText() === "Promise") {
    schema = { type: "object" } // Simplified handling of Promise
  } else {
    schema = { type: "object" } // Default to object for complex types
  }

  if (typeName != null) {
    types[typeName] = schema
  }

  return schema
}
