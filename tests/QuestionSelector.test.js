import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import QuestionSelector from '../src/components/QuestionSelector.vue'
import * as state from '../src/composables/useDocument.js'
import { resetDocumentState } from './helpers/resetDocumentState.js'

const { suggestEdit } = vi.hoisted(() => ({
  suggestEdit: vi.fn(),
}))

vi.mock('../src/services/api.js', () => ({
  suggestEdit,
}))

describe('QuestionSelector', () => {
  beforeEach(() => {
    resetDocumentState(state)
    suggestEdit.mockReset()
  })

  it('creates a root bubble from the committed document content', async () => {
    state.doc.content = 'Base document\n'
    suggestEdit.mockResolvedValue({
      modifiedContent: 'Edited document\n',
      explanation: 'Updated',
    })

    const wrapper = mount(QuestionSelector, {
      props: { parentBubble: null },
    })

    await wrapper.find('input').setValue('Improve this')
    await wrapper.findAll('button').find(button => button.text() === 'Ask').trigger('click')
    await flushPromises()

    expect(suggestEdit).toHaveBeenCalledWith('Base document\n', 'Improve this', null, [])
    expect(state.doc.bubbles).toHaveLength(1)
    expect(state.activeBubbleId.value).toBe(state.doc.bubbles[0].id)
    expect(state.doc.bubbles[0].baseContent).toBe('Base document\n')
    expect(state.doc.bubbles[0].status).toBe('open')
    expect(state.doc.bubbles[0].explanation).toBe('Updated')
  })

  it('creates child bubbles from the parent preview content', async () => {
    state.doc.content = 'Hello\n'

    const parent = state.createBubble('Parent question')
    state.addRootBubble(parent)
    state.computeBubbleHunks(parent, 'Hello there\n')

    suggestEdit.mockResolvedValue({
      modifiedContent: 'Hello there again\n',
      explanation: 'Child update',
    })

    const wrapper = mount(QuestionSelector, {
      props: { parentBubble: parent },
    })

    await wrapper.find('input').setValue('Refine it')
    await wrapper.findAll('button').find(button => button.text() === 'Ask').trigger('click')
    await flushPromises()

    expect(suggestEdit).toHaveBeenCalledWith('Hello there\n', 'Refine it', null, [])
    expect(parent.children).toHaveLength(1)
    expect(parent.children[0].baseContent).toBe('Hello there\n')
    expect(parent.children[0].status).toBe('open')
  })

  it('marks a bubble as errored when the suggestion request fails', async () => {
    state.doc.content = 'Hello\n'
    suggestEdit.mockRejectedValue(new Error('API failed'))

    const wrapper = mount(QuestionSelector, {
      props: { parentBubble: null },
    })

    await wrapper.find('input').setValue('Break it')
    await wrapper.findAll('button').find(button => button.text() === 'Ask').trigger('click')
    await flushPromises()

    expect(state.doc.bubbles).toHaveLength(1)
    expect(state.doc.bubbles[0].status).toBe('error')
    expect(state.doc.bubbles[0].explanation).toBe('API failed')
  })
})
