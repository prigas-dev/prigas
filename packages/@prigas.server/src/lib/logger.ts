export const logger = {
  info(message: string, meta?: unknown) {
    log("info", message, meta)
  },
  warn(message: string, meta?: unknown) {
    log("warn", message, meta)
  },
  error(message: string | Error, meta?: unknown) {
    log("error", message, meta)
  },
  debug(message: string, meta?: unknown) {
    log("debug", message, meta)
  },
}

function log(
  level: "info" | "warn" | "error" | "debug",
  message: string | Error,
  meta?: unknown,
) {
  if (meta != null) {
    console[level](message, meta)
  } else {
    console[level](message)
  }
}
