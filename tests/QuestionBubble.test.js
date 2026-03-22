import { shallowMount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'

import QuestionBubble from '../src/components/QuestionBubble.vue'
import * as state from '../src/composables/useDocument.js'
import { resetDocumentState } from './helpers/resetDocumentState.js'

describe('QuestionBubble', () => {
  beforeEach(() => {
    resetDocumentState(state)
  })

  it('renders the follow-up selector above child bubbles in the branch column', () => {
    const bubble = state.createBubble('Parent')
    bubble.status = 'open'
    bubble.hunks = [{ type: 'context', value: 'Hello\n' }]

    const child = state.createBubble('Child', bubble.id)
    child.status = 'accepted'
    child.hunks = [{ type: 'context', value: 'Hello\n' }]
    bubble.children.push(child)

    const wrapper = shallowMount(QuestionBubble, {
      props: { bubble },
      global: {
        stubs: {
          DiffView: {
            template: '<div data-test="diff-view"></div>',
          },
          QuestionSelector: {
            template: '<div data-test="follow-up-selector"></div>',
          },
          QuestionBubble: {
            props: ['bubble'],
            template: '<div data-test="child-bubble">{{ bubble.question }}</div>',
          },
        },
      },
    })

    const html = wrapper.html()
    expect(html.indexOf('data-test="follow-up-selector"')).toBeGreaterThan(-1)
    expect(html.indexOf('data-test="child-bubble"')).toBeGreaterThan(html.indexOf('data-test="follow-up-selector"'))
  })
})
