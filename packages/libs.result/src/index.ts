import { z, ZodIssue } from "zod"
export type Result<V, E> = OkResult<V> | ErrResult<E>

export type OkResult<V> = [value: V, error: undefined]

export type ErrResult<E> = [value: undefined, error: E]

export function Ok(): OkResult<undefined>
export function Ok<V>(value: V): OkResult<V>
export function Ok<V>(value?: V): OkResult<V> {
  return [value as V, undefined]
}

export function Err<E>(error: E): ErrResult<E> {
  return [undefined, error]
}

export function ok<VS extends z.ZodTypeAny>(valueSchema: VS) {
  return z.tuple([valueSchema, z.undefined()])
}

export function err<ES extends z.ZodTypeAny>(errorSchema: ES) {
  return z.tuple([z.undefined(), errorSchema])
}

export function result<VS extends z.ZodTypeAny, ES extends z.ZodTypeAny>(
  valueSchema: VS,
  errorSchema: ES,
) {
  return z.union([ok(valueSchema), err(errorSchema)])
}

export const AppErrorSchema = z.object({
  message: z.string(),
  cause: z.unknown().optional(),
})
export interface AppError {
  message: string
  cause?: unknown
}
export function AppError<E extends AppError>(error: E): ErrResult<E> {
  return Err({
    ...error,
    cause: handleCause(error.cause),
  })
}

function handleCause(cause: unknown) {
  if (cause instanceof Error) {
    return {
      ...cause,
      message: cause.message,
      name: cause.name,
      stack: cause.stack,
      cause: cause.cause,
    }
  }
  return cause
}

export const AggregateErrorSchema = AppErrorSchema.and(
  z.object({
    type: z.literal("AggregateError"),
    errors: AppErrorSchema.array(),
  }),
)
export type AggregateError = z.infer<typeof AggregateErrorSchema>
export function AggregateError(
  message: string,
  errors: AppError[],
  cause?: unknown,
) {
  return AppError<AggregateError>({
    type: "AggregateError",
    message: message,
    cause: cause,
    errors: errors,
  })
}

export const NotFoundErrorSchema = AppErrorSchema.and(
  z.object({
    type: z.literal("NotFoundError"),
  }),
)
export type NotFoundError = z.infer<typeof NotFoundErrorSchema>
export function NotFoundError(message: string, cause?: unknown) {
  return AppError<NotFoundError>({
    type: "NotFoundError",
    message: message,
    cause: cause,
  })
}

export const UnexpectedErrorSchema = AppErrorSchema.and(
  z.object({
    type: z.literal("UnexpectedError"),
  }),
)
export type UnexpectedError = z.infer<typeof UnexpectedErrorSchema>
export function UnexpectedError(message: string, cause?: unknown) {
  return AppError<UnexpectedError>({
    type: "UnexpectedError",
    message: message,
    cause: cause,
  })
}

export const ValidationErrorSchema = AppErrorSchema.and(
  z.object({
    type: z.literal("ValidationError"),
    fieldErrors: z.custom<z.ZodIssue>().array(),
  }),
)
export type ValidationError = z.infer<typeof ValidationErrorSchema>
export function ValidationError(
  message: string,
  zodErrors?: ZodIssue[],
  cause?: unknown,
) {
  return AppError<ValidationError>({
    type: "ValidationError",
    message: message,
    fieldErrors: zodErrors ?? [],
    cause: cause,
  })
}

export const DefaultErrorSchema = z.union([
  UnexpectedErrorSchema,
  ValidationErrorSchema,
])
