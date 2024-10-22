import { Type } from "ts-morph"

export function getTypeName(type: Type) {
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
