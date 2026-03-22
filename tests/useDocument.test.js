import { beforeEach, describe, expect, it } from 'vitest'

import * as state from '../src/composables/useDocument.js'
import { resetDocumentState } from './helpers/resetDocumentState.js'

describe('useDocument', () => {
  beforeEach(() => {
    resetDocumentState(state)
  })

  it('builds preview content from undecided parent changes for follow-up questions', () => {
    state.doc.content = 'Hello\n'

    const bubble = state.createBubble('Improve greeting')
    state.computeBubbleHunks(bubble, 'Hello there\n')

    expect(state.getBubbleResult(bubble)).toBe('Hello\n')
    expect(state.getBubblePreview(bubble)).toBe('Hello there\n')
    expect(state.getBubbleSourceContent(bubble)).toBe('Hello there\n')

    const change = bubble.hunks.find(hunk => hunk.type === 'change')
    change.accepted = false

    expect(state.getBubblePreview(bubble)).toBe('Hello\n')
  })

  it('accepts an entire ancestor chain when a child bubble is accepted', () => {
    state.doc.content = 'Hello\n'

    const parent = state.createBubble('Parent edit')
    state.addRootBubble(parent)
    state.computeBubbleHunks(parent, 'Hello there\n')

    const child = state.createBubble('Child edit', parent.id, state.getBubbleSourceContent(parent))
    state.addChildBubble(parent, child)
    state.computeBubbleHunks(child, 'Hello there again\n')

    state.acceptBubble(child)

    expect(parent.status).toBe('accepted')
    expect(child.status).toBe('accepted')
    expect(state.doc.content).toBe('Hello there again\n')
  })

  it('returns preview content for the active bubble and falls back to the committed document when hidden', () => {
    state.doc.content = 'Committed text\n'

    const bubble = state.createBubble('Preview edit')
    state.addRootBubble(bubble)
    state.computeBubbleHunks(bubble, 'Preview text\n')

    const change = bubble.hunks.find(hunk => hunk.type === 'change')
    change.accepted = true
    state.setPreviewBubble(bubble)

    expect(state.getDocumentDisplayContent()).toBe('Preview text\n')

    state.rejectBubble(bubble)

    expect(state.getDocumentDisplayContent()).toBe('Committed text\n')
  })

  it('collects excluded questions recursively from rejected and closed bubbles', () => {
    const root = state.createBubble('Root')
    const child = state.createBubble('Child', root.id)
    const sibling = state.createBubble('Sibling')

    state.addRootBubble(root)
    state.addChildBubble(root, child)
    state.addRootBubble(sibling)

    state.rejectBubble(root)
    state.closeBubble(child)

    expect(state.getExcludedQuestions()).toEqual(['Root', 'Child'])
  })
})
