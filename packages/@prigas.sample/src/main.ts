import { createServer } from "./server.js"

const server = createServer()
server.listen(8090, function () {
  console.log("Server started. http://localhost:8090")
})
