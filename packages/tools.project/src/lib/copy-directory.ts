import { mkdir, readdir, rename } from "node:fs/promises"
import path from "node:path"

export async function copyDirectory(src: string, dest: string) {
  // Ensure the target directory exists
  await mkdir(dest, { recursive: true })

  // Read files from the source directory
  const files = await readdir(src, { recursive: true, withFileTypes: true })

  // Move each file
  for (const file of files) {
    if (file.isDirectory()) {
      continue
    }

    const folder = path.relative(src, file.parentPath)

    const oldPath = path.join(src, folder, file.name)
    const newPath = path.join(dest, folder, file.name)
    await rename(oldPath, newPath)
  }
}
