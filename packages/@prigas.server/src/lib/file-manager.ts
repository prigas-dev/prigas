import { AppError, Ok } from "libs.result"
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises"
import path from "path"
import { jsonStringify } from "./json.js"

export class FileManager {
  async readFile(filePath: string): Promise<string | null> {
    try {
      const content = await readFile(filePath, { encoding: "utf-8" })
      return content
    } catch {
      return null
    }
  }

  async writeFile(filePath: string, content: unknown) {
    try {
      const dir = path.dirname(filePath)
      await mkdir(dir, { recursive: true })
      const contentString =
        typeof content === "string" ? content : jsonStringify(content)
      await writeFile(filePath, contentString)
      return Ok()
    } catch (error) {
      return FileWriteError(filePath, error)
    }
  }

  async readdir(dirPath: string) {
    try {
      await mkdir(dirPath, { recursive: true })
      const entries = await readdir(dirPath, { withFileTypes: true })
      return Ok(entries)
    } catch (error) {
      return DirReadError(dirPath, error)
    }
  }

  async rm(filePath: string) {
    try {
      await rm(filePath, { recursive: true, force: true })
      return Ok()
    } catch (error) {
      return FileRmError(filePath, error)
    }
  }

  async stat(filePath: string) {
    try {
      const stats = await stat(filePath)
      return Ok(stats)
    } catch (error) {
      return FileStatError(filePath, error)
    }
  }
}

interface DirReadError extends AppError {
  type: "DirReadError"
  filePath: string
}
function DirReadError(dirPath: string, cause?: unknown) {
  return AppError<DirReadError>({
    type: "DirReadError",
    filePath: dirPath,
    message: "Failed to read dir",
    cause: cause,
  })
}

interface FileRmError extends AppError {
  type: "FileRmError"
  filePath: string
}
function FileRmError(filePath: string, cause?: unknown) {
  return AppError<FileRmError>({
    type: "FileRmError",
    filePath: filePath,
    message: "Failed to remove file",
    cause: cause,
  })
}

interface FileWriteError extends AppError {
  type: "FileWriteError"
  filePath: string
}
function FileWriteError(filePath: string, cause?: unknown) {
  return AppError<FileWriteError>({
    type: "FileWriteError",
    filePath: filePath,
    message: "Failed to write file",
    cause: cause,
  })
}

interface FileStatError extends AppError {
  type: "FileStatError"
  filePath: string
}
function FileStatError(filePath: string, cause?: unknown) {
  return AppError<FileStatError>({
    type: "FileStatError",
    filePath: filePath,
    message: "Failed to write file",
    cause: cause,
  })
}
