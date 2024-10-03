import { AppError, Ok } from "libs.result"

interface JsonParseError extends AppError {
  type: "JsonParseError"
}
function JsonParseError(cause?: unknown) {
  return AppError<JsonParseError>({
    type: "JsonParseError",
    message: "Failed to JSON.parse",
    cause: cause,
  })
}
export function jsonParse(json: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedObject = JSON.parse(json)
    return Ok(parsedObject)
  } catch (error) {
    return JsonParseError(error)
  }
}

export interface JsonStringifyOptions {
  minify?: boolean
}
export function jsonStringify(
  obj: unknown,
  options: JsonStringifyOptions = {},
) {
  if (options.minify) {
    return JSON.stringify(obj)
  }
  return JSON.stringify(obj, null, 2)
}
