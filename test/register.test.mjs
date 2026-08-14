import { test } from 'node:test'
import assert from 'node:assert/strict'
import { apply, inject } from '../lib/index.js'

function makeFakeCtx() {
  const registered = []
  const listeners = {}
  const ctx = {
    tools: {
      register(definition) {
        registered.push(definition)
        return () => {
          const index = registered.indexOf(definition)
          if (index >= 0) registered.splice(index, 1)
        }
      },
    },
    on(event, listener) {
      (listeners[event] ??= []).push(listener)
      return () => {}
    },
  }
  return { ctx, registered, listeners }
}

test('inject 只声明 tools', () => {
  assert.deepEqual(inject, ['tools'])
})

test('apply 注册 3 个工具；配置非法不抛', () => {
  const { ctx, registered } = makeFakeCtx()
  assert.doesNotThrow(() => apply(ctx, {}))
  assert.equal(registered.length, 3)
  const second = makeFakeCtx()
  assert.doesNotThrow(() => apply(second.ctx, { timeoutMs: -1 }))
  assert.equal(second.registered.length, 3)
})

test('dispose 卸载全部工具', () => {
  const { ctx, registered, listeners } = makeFakeCtx()
  apply(ctx, {})
  assert.equal(registered.length, 3)
  for (const listener of listeners.dispose ?? []) listener()
  assert.equal(registered.length, 0)
})
