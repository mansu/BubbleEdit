// @vitest-environment node

import { describe, expect, it, vi } from 'vitest'

import {
  ALLOWED_MODELS,
  DEFAULT_MODEL,
  createAnthropicChat,
  createDetectDomainHandler,
  createGenerateQuestionsHandler,
  createSuggestEditHandler,
} from '../app.js'

function createMockRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code
      return this
    },
    json(payload) {
      this.body = payload
      return this
    },
  }
}

describe('server chat helper', () => {
  it('strips fenced JSON and falls back to the default model when needed', async () => {
    const create = vi.fn().mockResolvedValue({
      content: [{ text: '```json\n{"ok":true}\n```' }],
    })
    const chat = createAnthropicChat({ messages: { create } })

    const result = await chat('System prompt', 'User prompt', 123, 'not-allowed')

    expect(result).toEqual({ ok: true })
    expect(create).toHaveBeenCalledWith({
      model: DEFAULT_MODEL,
      max_tokens: 123,
      system: [{
        type: 'text',
        text: 'System prompt\n\nRespond with only valid JSON. No markdown code blocks, no explanation outside the JSON.',
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{ role: 'user', content: 'User prompt' }],
    })
  })

  it('passes through allowed models unchanged', async () => {
    const allowedModel = [...ALLOWED_MODELS][1]
    const create = vi.fn().mockResolvedValue({
      content: [{ text: '{"ok":true}' }],
    })
    const chat = createAnthropicChat({ messages: { create } })

    await chat('System prompt', 'User prompt', 77, allowedModel)

    expect(create.mock.calls[0][0].model).toBe(allowedModel)
  })
})

describe('server routes', () => {
  it('handles /api/detect-domain', async () => {
    const chat = vi.fn().mockResolvedValue({
      domain: 'legal contract',
      persona: 'experienced contract attorney',
      description: 'A commercial agreement.',
    })
    const handler = createDetectDomainHandler(chat)
    const res = createMockRes()

    await handler({
      body: { content: 'A'.repeat(2500), model: 'claude-sonnet-4-6' },
    }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.domain).toBe('legal contract')
    expect(chat).toHaveBeenCalledWith(
      'You are a document classifier.',
      expect.stringContaining(`Document:\n${'A'.repeat(2000)}`),
      256,
      'claude-sonnet-4-6',
    )
    expect(chat.mock.calls[0][1]).not.toContain('A'.repeat(2100))
  })

  it('handles /api/generate-questions', async () => {
    const chat = vi.fn().mockResolvedValue({
      questions: ['Is the indemnity clause balanced?'],
    })
    const handler = createGenerateQuestionsHandler(chat)
    const res = createMockRes()

    await handler({
      body: {
        content: 'B'.repeat(3500),
        domain: 'legal contract',
        persona: 'experienced contract attorney',
        model: 'claude-opus-4-6',
      },
    }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body.questions).toEqual(['Is the indemnity clause balanced?'])
    expect(chat).toHaveBeenCalledWith(
      'You are experienced contract attorney, an expert in legal contract.',
      expect.stringContaining(`Document:\n${'B'.repeat(3000)}`),
      512,
      'claude-opus-4-6',
    )
  })

  it('handles /api/suggest-edit with exclusions and token scaling', async () => {
    const chat = vi.fn().mockResolvedValue({
      modifiedContent: 'Updated doc',
      explanation: 'Tightened the wording.',
    })
    const handler = createSuggestEditHandler(chat)
    const res = createMockRes()

    await handler({
      body: {
        content: 'C'.repeat(10000),
        question: 'Tighten the language',
        persona: 'senior editor',
        excludedQuestions: ['Do not soften the tone', 'Do not shorten it'],
        model: 'claude-haiku-4-5-20251001',
      },
    }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      modifiedContent: 'Updated doc',
      explanation: 'Tightened the wording.',
    })
    expect(chat).toHaveBeenCalledWith(
      'You are senior editor. Make targeted, minimal edits — only change what is necessary.',
      expect.stringContaining('Do NOT repeat these already-rejected suggestions:\n- Do not soften the tone\n- Do not shorten it'),
      4096,
      'claude-haiku-4-5-20251001',
    )
  })

  it('returns 500 when a route chat call fails', async () => {
    const handler = createSuggestEditHandler(
      vi.fn().mockRejectedValue(new Error('Anthropic unavailable')),
    )
    const res = createMockRes()

    await handler({
      body: {
        content: 'Draft',
        question: 'Edit it',
        excludedQuestions: [],
      },
    }, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: 'Anthropic unavailable' })
  })
})
