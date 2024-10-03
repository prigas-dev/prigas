import {rm} from 'node:fs/promises'

beforeEach(async function () {
  await rm('.testoutputs', {force: true, recursive: true})
})
