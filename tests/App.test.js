import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { resetDocumentState } from './helpers/resetDocumentState.js'

const { detectDomain, generateQuestions } = vi.hoisted(() => ({
  detectDomain: vi.fn(),
  generateQuestions: vi.fn(),
}))

vi.mock('../src/services/api.js', () => ({
  detectDomain,
  generateQuestions,
}))

function setFilePicker(value) {
  Object.defineProperty(window, 'showOpenFilePicker', {
    configurable: true,
    writable: true,
    value,
  })
}

async function loadAppWithState() {
  vi.resetModules()
  const appModule = await import('../src/App.vue')
  const state = await import('../src/composables/useDocument.js')
  resetDocumentState(state)
  return { App: appModule.default, state }
}

function findButton(wrapper, label) {
  return wrapper.findAll('button').find(button => button.text().includes(label))
}

describe('App', () => {
  beforeEach(() => {
    detectDomain.mockReset()
    generateQuestions.mockReset()
  })

  it('shows the browser support warning when the File System API is unavailable', async () => {
    delete window.showOpenFilePicker
    const { App } = await loadAppWithState()

    const wrapper = mount(App, {
      global: {
        stubs: {
          DocumentBubble: true,
        },
      },
    })

    expect(wrapper.text()).toContain('File System API not supported in this browser.')
  })

  it('opens a file and populates the detected domain questions', async () => {
    const file = {
      name: 'draft.md',
      text: vi.fn().mockResolvedValue('Original content\n'),
    }
    const handle = {
      getFile: vi.fn().mockResolvedValue(file),
    }

    setFilePicker(vi.fn().mockResolvedValue([handle]))
    detectDomain.mockResolvedValue({ domain: 'Legal', persona: 'Contract attorney' })
    generateQuestions.mockResolvedValue({ questions: ['Tighten definitions'] })

    const { App, state } = await loadAppWithState()
    const wrapper = mount(App, {
      global: {
        stubs: {
          DocumentBubble: true,
        },
      },
    })

    await findButton(wrapper, 'Open Markdown File').trigger('click')
    await flushPromises()
    await flushPromises()

    expect(window.showOpenFilePicker).toHaveBeenCalled()
    expect(detectDomain).toHaveBeenCalledWith('Original content\n')
    expect(generateQuestions).toHaveBeenCalledWith('Original content\n', 'Legal', 'Contract attorney')
    expect(state.doc.fileName).toBe('draft.md')
    expect(state.doc.content).toBe('Original content\n')
    expect(state.doc.domain).toBe('Legal')
    expect(state.doc.persona).toBe('Contract attorney')
    expect(state.doc.domainQuestions).toEqual(['Tighten definitions'])
  })

  it('saves the committed document content through the file handle', async () => {
    const write = vi.fn()
    const close = vi.fn()
    const createWritable = vi.fn().mockResolvedValue({ write, close })

    setFilePicker(vi.fn())
    const { App, state } = await loadAppWithState()
    state.doc.fileName = 'draft.md'
    state.doc.fileHandle = { createWritable }
    state.doc.content = 'Saved content\n'

    const wrapper = mount(App, {
      global: {
        stubs: {
          DocumentBubble: true,
        },
      },
    })

    await findButton(wrapper, 'Save').trigger('click')
    await flushPromises()

    expect(createWritable).toHaveBeenCalled()
    expect(write).toHaveBeenCalledWith('Saved content\n')
    expect(close).toHaveBeenCalled()
  })
})
