import JSZip from 'jszip'
import {readFileSync} from 'node:fs'
import {mkdir, readFile, readdir, writeFile} from 'node:fs/promises'
import https from 'node:https'
import path from 'node:path'
import {PassThrough} from 'node:stream'
import {fileURLToPath} from 'node:url'

export class ProjectGenerator {
  constructor(private readonly templateProvider: ITemplateProvider, private readonly fileSystem: IFileSystem) {}

  async generate(templateName: string, outputFolder: string) {
    const templateFiles = await this.templateProvider.getTemplateFiles(templateName)
    await Promise.all(
      templateFiles.map(async ({content, filename}) => {
        const fullPath = path.join(outputFolder, filename)
        await this.fileSystem.writeFile(fullPath, content)
      }),
    )
  }
}

export type TemplateFile = {
  content: string
  filename: string
}
export interface ITemplateProvider {
  getTemplateFiles(templateName: string): Promise<TemplateFile[]>
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export class DevTemplateProvider implements ITemplateProvider {
  async getTemplateFiles(templateName: string): Promise<TemplateFile[]> {
    const templateFolder = path.join(__dirname, '..', '..', 'templates', templateName)

    const templateFiles = await this.getTemplateFilesFromFolder(templateFolder)

    return templateFiles
  }

  private async getTemplateFilesFromFolder(folder: string, basePath = '.'): Promise<TemplateFile[]> {
    const entries = await readdir(folder, {withFileTypes: true})
    const templateFiles: TemplateFile[] = []

    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(folder, entry.name)
        const filename = path.join(basePath, entry.name)
        if (entry.isFile()) {
          const content = await readFile(fullPath, {encoding: 'utf8'})

          templateFiles.push({content, filename})
        } else if (entry.isDirectory()) {
          const subFolderTemplateFiles = await this.getTemplateFilesFromFolder(fullPath, filename)
          templateFiles.push(...subFolderTemplateFiles)
        }
      }),
    )
    return templateFiles
  }
}

export class GithubReleasesTemplateProvider implements ITemplateProvider {
  private readonly releaseTag: string

  constructor(releaseTag?: string) {
    if (releaseTag) {
      this.releaseTag = releaseTag
    } else {
      const packageJson = JSON.parse(readFileSync(path.join(__dirname, '..', '..', 'package.json'), {encoding: 'utf8'}))
      this.releaseTag = 'v' + packageJson.version
    }
  }

  async getTemplateFiles(templateName: string): Promise<TemplateFile[]> {
    const url = `https://github.com/prigas-dev/prigas/releases/download/${this.releaseTag}/template-${templateName}.zip`
    const stream = this.createReadableStreamFromUrl(url)

    const zip = new JSZip()
    await zip.loadAsync(stream)

    const templateFiles = await Promise.all(
      Object.entries(zip.files).map(async ([filename, zipFile]) => {
        const content = await zipFile.async('string')

        const templateFile: TemplateFile = {
          content,
          filename,
        }
        return templateFile
      }),
    )

    return templateFiles
  }

  private createReadableStreamFromUrl(url: string) {
    const passThrough = new PassThrough()

    https
      .get(url, (res) => {
        res.pipe(passThrough)
      })
      .on('error', (err) => {
        passThrough.emit('error', err)
      })

    return passThrough
  }
}

export interface IFileSystem {
  writeFile(filePath: string, content: string): Promise<void>
}

export class DefaultFileSystem implements IFileSystem {
  async writeFile(filePath: string, content: string): Promise<void> {
    await mkdir(path.dirname(filePath), {recursive: true})
    await writeFile(filePath, content)
  }
}
