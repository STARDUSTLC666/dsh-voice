import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { apply, buildVoiceTools, resolveConfig } from '../lib/index.js'

const here = path.dirname(fileURLToPath(import.meta.url))
let toolsDirectory
if (process.env.DSH_VOICE_TEST_HOST_TOOLS) toolsDirectory = process.env.DSH_VOICE_TEST_HOST_TOOLS
else {
  try {
    const mappings = JSON.parse(await readFile(path.join(here, '../../global-contracts-owned/runtime-mappings.json'), 'utf8'))
    toolsDirectory = mappings.mappings['packages/core/tools']
    await access(path.join(toolsDirectory, 'lib/index.js'))
  } catch { /* Standalone repositories can provide an installed official host explicitly. */ }
}

test('all Voice tools register with the official DSH schema subset and render both PTC SDKs', {
  skip: !toolsDirectory && 'Set DSH_VOICE_TEST_HOST_TOOLS to the official installed @deepseek-ai/dsh-tools directory',
}, async () => {
  const hostTools = await import(pathToFileURL(path.join(toolsDirectory, 'lib/index.js')).href)
  const require = createRequire(pathToFileURL(path.join(toolsDirectory, 'package.json')))
  const sdk = typeof hostTools.renderToolsSdk === 'function' ? hostTools : await import(pathToFileURL(require.resolve('@deepseek-ai/dsh-tool-executor-ptc')).href)
  const registered = []
  apply({tools:{register(tool){hostTools.assertObjectJsonSchema(tool.parameters); registered.push(tool); return ()=>{}}}}, {})
  assert.equal(registered.length, 6)
  const schemas = registered.map(({name,description,parameters})=>({name,description,parameters}))
  for (const render of [sdk.renderToolsSdk, sdk.renderToolsSdkPy]) {
    const source = render(schemas)
    for (const {name} of registered) assert.ok(source.includes(name))
  }
})

test('Voice numeric limits remain visible in descriptions without unsupported schema keywords', () => {
  const tools = buildVoiceTools(resolveConfig({}))
  assert.equal(tools.length, 6)
  const tts = tools.find(tool=>tool.name==='voice_tts')
  assert.match(tts.parameters.properties.bgmVolume.description, /0\.02.*1\.0/)
  assert.match(tts.parameters.properties.maxCharsPerCue.description, /4.*80/)
  assert.match(tts.parameters.properties.targetDurationSec.description, /3.*3600/)
  const unsupported = new Set(['minimum', 'maximum', 'minLength', 'maxLength', 'minItems', 'maxItems'])
  const walk = (node, path) => {
    if (!node || typeof node !== 'object') return
    for (const key of Object.keys(node)) {
      assert.equal(unsupported.has(key), false, `unsupported JSON Schema keyword "${key}" at ${path}`)
      walk(node[key], `${path}.${key}`)
    }
  }
  for (const tool of tools) {
    walk(tool.parameters, tool.name)
  }
})
