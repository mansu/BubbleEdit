import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import DocumentBubble from '../src/components/DocumentBubble.vue'
import * as state from '../src/composables/useDocument.js'
import { resetDocumentState } from './helpers/resetDocumentState.js'

describe('DocumentBubble', () => {
  beforeEach(() => {
    resetDocumentState(state)
  })

  it('renders the root question selector above the root bubble list', () => {
    state.doc.content = 'Document text\n'

    const bubble = state.createBubble('Root bubble')
    state.addRootBubble(bubble)

    const wrapper = mount(DocumentBubble, {
      global: {
        stubs: {
          QuestionSelector: {
            template: '<div data-test="root-selector">selector</div>',
          },
          QuestionBubble: {
            props: ['bubble'],
            template: '<div data-test="root-bubble">{{ bubble.question }}</div>',
          },
        },
      },
    })

    const html = wrapper.html()
    expect(html.indexOf('data-test="root-selector"')).toBeGreaterThan(-1)
    expect(html.indexOf('data-test="root-bubble"')).toBeGreaterThan(html.indexOf('data-test="root-selector"'))
  })

  it('renders preview content in the document pane when a preview bubble is active', () => {
    state.doc.content = 'Committed text\n'

    const bubble = state.createBubble('Preview bubble')
    state.addRootBubble(bubble)
    state.computeBubbleHunks(bubble, 'Preview text\n')
    bubble.hunks.find(hunk => hunk.type === 'change').accepted = true
    state.setPreviewBubble(bubble)

    const wrapper = mount(DocumentBubble, {
      global: {
        stubs: {
          QuestionSelector: true,
          QuestionBubble: true,
        },
      },
    })

    expect(wrapper.find('.markdown-body').text()).toContain('Preview text')
    expect(wrapper.find('.markdown-body').text()).not.toContain('Committed text')
  })
})
