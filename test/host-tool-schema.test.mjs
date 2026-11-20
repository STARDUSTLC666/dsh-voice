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
  assert.equal(registered.length, 5)
  const schemas = registered.map(({name,description,parameters})=>({name,description,parameters}))
  for (const render of [sdk.renderToolsSdk, sdk.renderToolsSdkPy]) {
    const source = render(schemas)
    for (const {name} of registered) assert.ok(source.includes(name))
  }
})

test('Voice numeric limits remain visible in descriptions without unsupported schema keywords', () => {
  const tts = buildVoiceTools(resolveConfig({})).find(tool=>tool.name==='voice_tts')
  assert.match(tts.parameters.properties.bgmVolume.description, /0\.02.*1\.0/)
  assert.match(tts.parameters.properties.maxCharsPerCue.description, /4.*80/)
  for (const name of ['bgmVolume', 'maxCharsPerCue']) {
    assert.equal('minimum' in tts.parameters.properties[name], false)
    assert.equal('maximum' in tts.parameters.properties[name], false)
  }
})
