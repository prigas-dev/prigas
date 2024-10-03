import { env } from "@/env"
import { initClient } from "@ts-rest/core"
import { initTsrReactQuery } from "@ts-rest/react-query/v5"
import { api } from "apps.backend.api"

export const tsr = initTsrReactQuery(api, {
  baseUrl: env.BackendBaseUrl,
  baseHeaders: {},
})

export const fetchClient = initClient(api, {
  baseUrl: env.BackendBaseUrl,
  baseHeaders: {},
})
