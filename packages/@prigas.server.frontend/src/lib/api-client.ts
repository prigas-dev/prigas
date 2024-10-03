import { env } from "@/env"
import { api } from "@prigas/server.api"
import { initClient } from "@ts-rest/core"
import { initTsrReactQuery } from "@ts-rest/react-query/v5"

export const tsr = initTsrReactQuery(api, {
  baseUrl: env.BackendBaseUrl,
  baseHeaders: {},
})

export const fetchClient = initClient(api, {
  baseUrl: env.BackendBaseUrl,
  baseHeaders: {},
})
