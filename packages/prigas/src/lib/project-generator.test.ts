import {readFile} from 'node:fs/promises'
import path from 'node:path'
import {mock} from 'vitest-mock-extended'

import {
  DefaultFileSystem,
  DevTemplateProvider,
  IFileSystem,
  ITemplateProvider,
  ProjectGenerator,
  TemplateFile,
} from './project-generator.js'

describe('ProjectGenerator', function () {
  it('should write template files to destination folder', async function () {
    const templateProvider = mock<ITemplateProvider>()
    templateProvider.getTemplateFiles.mockResolvedValue([
      {
        content: 'text',
        filename: 'file.txt',
      },
      {
        content: 'other',
        filename: 'dir/other.txt',
      },
    ])
    const fileSystem = mock<IFileSystem>()
    const projectGenerator = new ProjectGenerator(templateProvider, fileSystem)

    await projectGenerator.generate('dummy', 'output')

    const _ = path.sep
    expect(fileSystem.writeFile).toHaveBeenCalledWith(`output${_}file.txt`, 'text')
    expect(fileSystem.writeFile).toHaveBeenCalledWith(`output${_}dir${_}other.txt`, 'other')
  })
})

describe('DevTemplateProvider', function () {
  it('should read contents from templates folder', async function () {
    const templateProvider = new DevTemplateProvider()

    const templateFiles = await templateProvider.getTemplateFiles('_test')

    const _ = path.sep
    expect(templateFiles).toHaveLength(2)
    expect(templateFiles).toContainEqual<TemplateFile>({
      content: 'text',
      filename: 'file.txt',
    })
    expect(templateFiles).toContainEqual<TemplateFile>({
      content: 'other',
      filename: `dir${_}other.txt`,
    })
  })
})

describe('DefaultFileSystem', function () {
  it('should create files and directories', async function () {
    const fileSystem = new DefaultFileSystem()

    await fileSystem.writeFile(path.join('.testoutputs', 'file.txt'), 'text')
    await fileSystem.writeFile(path.join('.testoutputs', 'other', 'other.txt'), 'other')

    const contentFile = await readFile(path.join('.testoutputs', 'file.txt'), {encoding: 'utf8'})
    const contentOther = await readFile(path.join('.testoutputs', 'other', 'other.txt'), {encoding: 'utf8'})

    expect(contentFile).toEqual('text')
    expect(contentOther).toEqual('other')
  })
})
