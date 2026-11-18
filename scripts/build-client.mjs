import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const normalize = value => value.replace(/\r\n/g, '\n')
const read = rel => normalize(readFileSync(join(root, rel), 'utf8'))

const themesCss = read('templates/themes-and-motion.css')
const styleSwitcher = read('templates/style-switcher.js')
  .replace(/^export\s+(?=(?:const|function)\b)/gm, '')
const kit = read('templates/workbench-ui.js')

let client = read('templates/client.js')
const directory = join(root, 'templates/panels')
const parts = existsSync(directory)
  ? readdirSync(directory).filter(name => name.endsWith('.js')).sort().map(name => read('templates/panels/' + name)).join('\n')
  : ''

const marker = 'const W = createWorkbenchUI(React, require);'
if (!client.includes(marker)) throw new Error('Workbench source marker missing')
client = client.replace(marker, () => marker + '\n' + parts)

const output = [
  '// Generated from templates/client.js, templates/panels/, templates/style-switcher.js, templates/themes-and-motion.css and templates/workbench-ui.js. Edit the sources.',
  '(function () {',
  'const DSH_THEMES_AND_MOTION_CSS = ' + JSON.stringify(themesCss) + ';',
  styleSwitcher,
  kit,
  client,
  '})();',
].join('\n') + '\n'

mkdirSync(join(root, 'lib'), { recursive: true })
writeFileSync(join(root, 'lib/client.js'), output)
