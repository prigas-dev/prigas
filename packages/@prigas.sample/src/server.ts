import http from "http"
import { createContext, RequestContext } from "./lib/request-context.js"
import { AddTodo } from "./operations/add-todo.js"

export function createServer(options: http.ServerOptions = {}) {
  const server = http.createServer(
    options,

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    async (req, res) => {
      try {
        if (req.method !== "POST") {
          res.writeHead(405)
          res.end("Only POST method is allowed.")
          return
        }

        const operation = getOperationByPath(req.url ?? "/")
        if (operation == null) {
          res.writeHead(404)
          res.end(`Operation "${req.url}" not found.`)
          return
        }

        const contentLengthStr = req.headers["content-length"]
        if (contentLengthStr == null || contentLengthStr.length === 0) {
          res.writeHead(400)
          res.end("Content-Length header is required.")
          return
        }

        const bodyLength = parseInt(contentLengthStr)
        if (isNaN(bodyLength) || bodyLength <= 0) {
          res.writeHead(400)
          res.end("Invalid Content-Length header.")
          return
        }

        let context: RequestContext
        try {
          context = await createContext(req)
        } catch {
          res.writeHead(501)
          res.end("Failed to create context.")
          return
        }

        let body: string
        try {
          req.setEncoding("utf-8")
          body = await streamToString(req)
        } catch {
          res.writeHead(501)
          res.end("Failed to read the body 📖😏.")
          return
        }

        let bodyObject: unknown
        try {
          bodyObject = JSON.parse(body)
        } catch {
          res.writeHead(400)
          res.end("Invalid request body JSON.")
          return
        }

        let operationHandler: InstanceType<typeof operation>
        try {
          operationHandler = new operation()
        } catch {
          res.writeHead(501)
          res.end("Failed to instantiate operation handler.")
          return
        }

        let output: unknown
        try {
          // Validation of the body object is task for the operation handler
          // by using the @parse decorator
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          output = await operationHandler.execute(bodyObject as any, context)
        } catch {
          res.writeHead(500)
          res.end("There was an error on operation execution.")
          return
        }

        try {
          const outputStr = JSON.stringify(output)
          res.writeHead(200, {
            "content-type": "application/json",
          })
          res.end(outputStr)
        } catch {
          res.writeHead(501)
          res.end("Failed to JSON stringiy operation output.")
          return
        }
      } catch {
        res.writeHead(500)
        res.end("Something wrong happened.")
        return
      }
    },
  )

  return server
}

const map = new Map([["/api/addTodo", AddTodo]])

function getOperationByPath(path: string) {
  if (path.length === 0) {
    return null
  }
  const lastCharacter = path[path.length - 1]
  const normalizedPath =
    lastCharacter == "/" ? path.substring(0, path.length - 1) : path

  const operation = map.get(normalizedPath)
  if (operation == null) {
    return null
  }

  return operation
}

async function streamToString(stream: NodeJS.ReadableStream) {
  // lets have a ReadableStream as a stream variable
  const chunks = []

  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk))
  }

  return Buffer.concat(chunks).toString("utf-8")
}
