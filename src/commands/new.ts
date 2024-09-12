import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {dirname, join} from 'node:path'
import {fileURLToPath} from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const templatesFolder = join(__dirname, '..', '..', 'templates')
const reactAppTemplateFolder = join(templatesFolder, 'react-app')

export default class New extends Command {
  static override args = {}

  static override description = 'Create a new application'

  static override examples = ['<%= config.bin %> <%= command.id %>']

  static override flags = {
    name: Flags.string({
      char: 'n',
      name: 'applicationName' as const,
      summary: 'Application name',
    }),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(New)

    const name = flags.name || (await input({message: `What's the application name?`, required: true}))

    this.log(reactAppTemplateFolder)
    this.log(`hello ${name}`)
  }
}
