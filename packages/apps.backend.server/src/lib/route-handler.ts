import {
  AppRoute,
  AppRouteMutation,
  AppRouter,
  FlattenAppRouter,
  ResolveResponseType,
  ServerInferRequest,
  ServerInferResponses,
  ZodInferOrType,
  ZodInputOrType,
} from "@ts-rest/core"
import fastify from "fastify"
import { UnexpectedError } from "libs.result"

interface FastifyContextConfig<T extends AppRouter | AppRoute> {
  tsRestRoute: T extends AppRoute ? T : FlattenAppRouter<T>
}

type AppRouteImplementation<T extends AppRoute> = (
  input: ServerInferRequest<T, fastify.FastifyRequest["headers"]> & {
    request: fastify.FastifyRequest<
      fastify.RouteGenericInterface,
      fastify.RawServerDefault,
      fastify.RawRequestDefaultExpression,
      fastify.FastifySchema,
      fastify.FastifyTypeProviderDefault,
      FastifyContextConfig<T>
    >
    reply: fastify.FastifyReply<
      fastify.RawServerDefault,
      fastify.RawRequestDefaultExpression,
      fastify.RawReplyDefaultExpression,
      fastify.RouteGenericInterface,
      FastifyContextConfig<T>
    >
    appRoute: T
  },
) => Promise<ServerInferResponses<T>>

type AppRouteInput<T extends AppRoute> = T extends AppRouteMutation
  ? T["body"]
  : T["query"]

export function routeHandler<T extends AppRoute>(
  handler: (
    input: ZodInferOrType<AppRouteInput<T>>,
  ) => Promise<ZodInputOrType<ResolveResponseType<T["responses"][200]>>>,
): AppRouteImplementation<T> {
  return async function (input) {
    try {
      const handlerInput = (
        "body" in input && input.body != null ? input.body : input.query
      ) as ZodInferOrType<AppRouteInput<T>>
      const result = await handler(handlerInput)
      return {
        body: result,
        status: 200,
      }
    } catch (error) {
      return {
        body: UnexpectedError("Unexpected error", error),
        status: 200,
      }
    }
  } as AppRouteImplementation<T>
}
