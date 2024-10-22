import type { JSONSchema7 } from "json-schema"
import { Type } from "ts-morph"
import { OperationHandler } from "./handlers.js"
import { getTypeName } from "./ts-morph.js"

type TypeCache = Partial<Record<string, JSONSchema7>>
export function getApiSchema(operationHandlers: OperationHandler[]) {
  const types: TypeCache = {}
  interface Operation {
    name: string
    input: JSONSchema7
    output: JSONSchema7
  }
  const operations: Operation[] = []

  for (const handlerDefinition of operationHandlers) {
    const inputTypeSchema = convertTypeToJsonSchema(
      handlerDefinition.input.type,
      types,
    )
    types[handlerDefinition.input.name] = inputTypeSchema
    const outputTypeSchema = convertTypeToJsonSchema(
      handlerDefinition.output.type,
      types,
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

  return apiSchema
}

function convertTypeToJsonSchema(type: Type, types: TypeCache): JSONSchema7 {
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
      items: convertTypeToJsonSchema(type.getArrayElementTypeOrThrow(), types),
    }
  } else if (type.isUnion()) {
    schema = {
      anyOf: type.getUnionTypes().map((t) => convertTypeToJsonSchema(t, types)),
    }
  } else if (type.isObject()) {
    const properties: JSONSchema7["properties"] = {}
    type.getProperties().forEach((prop) => {
      const propType = prop.getTypeAtLocation(prop.getDeclarations()[0])
      properties[prop.getName()] = convertTypeToJsonSchema(propType, types)
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
