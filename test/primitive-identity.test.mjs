import assert from 'node:assert/strict'
import test from 'node:test'
import { resolveHostPrimitives } from '../templates/style-switcher.js'

test('keeps control types stable and discovers host availability lazily', () => {
  const React = { createElement() {} }
  const original = { Menu() {}, Modal() {} }
  const replacement = { Menu() {}, Modal() {} }
  let host = null
  const requireHost = () => {
    if (!host) throw new Error('not mounted')
    return host
  }
  const fallback = resolveHostPrimitives(React, requireHost)
  for (const key of ['Input', 'Menu', 'Modal']) {
    assert.equal(resolveHostPrimitives(React, requireHost)[key], fallback[key], key)
  }
  host = original
  const mounted = resolveHostPrimitives(React, requireHost)
  assert.equal(mounted.isFallback, false)
  assert.notEqual(mounted.Modal, fallback.Modal)
  assert.equal(resolveHostPrimitives(React, requireHost).Modal, mounted.Modal)
  assert.equal(resolveHostPrimitives(React, requireHost).Menu, mounted.Menu)
  assert.notEqual(resolveHostPrimitives({ ...React }, requireHost).Modal, mounted.Modal)
  host = null
  assert.equal(resolveHostPrimitives(React, requireHost).Modal, fallback.Modal)
  host = replacement
  assert.notEqual(resolveHostPrimitives(React, requireHost).Modal, mounted.Modal)
})
