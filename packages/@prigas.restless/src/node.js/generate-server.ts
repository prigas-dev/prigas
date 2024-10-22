import { Model, parseTemplate, printModel } from "@prigas/generator"
import assert from "node:assert"
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import {
  getOperationHandlers,
  GetOperationHandlersOptions,
  OperationHandler,
} from "./handlers.js"

export interface GenerateServerOptions extends GetOperationHandlersOptions {
  serverPath: string
}
export async function generateServer({
  projectRoot,
  operationsPath,
  tsConfigPath,
  serverPath,
}: GenerateServerOptions) {
  const operationHandlers = getOperationHandlers({
    projectRoot,
    operationsPath,
    tsConfigPath,
  })

  const operationHandlersByModulePath: Partial<
    Record<string, OperationHandler[]>
  > = {}
  for (const operationHandler of operationHandlers) {
    const entry = operationHandlersByModulePath[operationHandler.modulePath]
    if (entry == null) {
      operationHandlersByModulePath[operationHandler.modulePath] = [
        operationHandler,
      ]
    } else {
      entry.push(operationHandler)
    }
  }

  const model: Model = {
    start: 0,
    end: 0,
    repeatBlocks: [
      {
        blocks: Object.entries(operationHandlersByModulePath).map(
          ([modulePath, moduleOperationHandlers]) => {
            assert(moduleOperationHandlers, "array should not be null")

            const moduleRelativePath =
              "./" +
              path
                .relative(path.dirname(serverPath), modulePath)
                .replaceAll("\\", "/")
                .replace(/\.ts$/, ".js")

            const moduleBlock: Model = {
              start: 0,
              end: 0,
              repeatBlocks: [
                {
                  blocks: moduleOperationHandlers.map((operationHandler) => {
                    const operationClass = operationHandler.class.getName()
                    assert(operationClass, "operation class should have a name")

                    const importBlock: Model = {
                      start: 0,
                      end: 0,
                      repeatBlocks: [],
                      interpolations: {
                        operationClass: operationClass,
                      },
                    }
                    return importBlock
                  }),
                },
              ],
              interpolations: {
                operationModulePath: moduleRelativePath,
              },
            }
            return moduleBlock
          },
        ),
      },
      {
        blocks: operationHandlers.map((operationHandler) => {
          const operationClass = operationHandler.class.getName()
          assert(operationClass, "operation class should have a name")

          const operationMapBlock: Model = {
            start: 0,
            end: 0,
            repeatBlocks: [],
            interpolations: {
              operationApiPath: `/api/${operationClass}`,
              operationClass: operationClass,
            },
          }

          return operationMapBlock
        }),
      },
    ],
    interpolations: {},
  }

  const serverTemplatePath = path.join(
    import.meta.dirname,
    "..",
    "..",
    "templates",
    "node.js",
    "server",
    "server.ts",
  )
  const serverTsContent = await readFile(serverTemplatePath, {
    encoding: "utf-8",
  })

  const template = parseTemplate(serverTsContent)
  const generatedSource = printModel(model, template.nodes)

  await writeFile(serverPath, generatedSource)
}
