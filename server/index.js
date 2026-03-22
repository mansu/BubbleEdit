import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DEFAULT_MODEL = process.env.MODEL || 'claude-haiku-4-5-20251001'
const ALLOWED_MODELS = new Set([
  'claude-haiku-4-5-20251001',
  'claude-sonnet-4-6',
  'claude-opus-4-6',
])

// ── Helpers ──────────────────────────────────────────────────────────────────

const JSON_INSTRUCTION = '\n\nRespond with only valid JSON. No markdown code blocks, no explanation outside the JSON.'

async function chat(system, user, maxTokens = 1024, model = DEFAULT_MODEL) {
  const response = await anthropic.messages.create({
    model: ALLOWED_MODELS.has(model) ? model : DEFAULT_MODEL,
    max_tokens: maxTokens,
    // cache_control on system prompt — repeated calls reuse the cached prompt,
    // cutting input token costs ~90% after the first call
    system: [{ type: 'text', text: system + JSON_INSTRUCTION, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: user }],
  })
  const text = response.content[0].text
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(cleaned)
}

// ── Routes ───────────────────────────────────────────────────────────────────

app.post('/api/detect-domain', async (req, res) => {
  try {
    const { content, model } = req.body
    const result = await chat(
      'You are a document classifier.',
      `Identify the domain and type of this document. Return JSON:
{
  "domain": "short label, e.g. 'legal contract', 'research paper', 'blog post', 'product spec'",
  "persona": "expert persona, e.g. 'experienced contract attorney', 'senior product manager'",
  "description": "one sentence describing the document"
}

Document:
${content.slice(0, 2000)}`,
      256,
      model,
    )
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/generate-questions', async (req, res) => {
  try {
    const { content, domain, persona, model } = req.body
    const result = await chat(
      `You are ${persona}, an expert in ${domain}.`,
      `Generate 8 targeted editing questions for this ${domain} document that an expert would ask.
Questions should be specific, actionable, and reflect expert-level concerns.

Return JSON:
{ "questions": ["question 1", "question 2", ...] }

Document:
${content.slice(0, 3000)}`,
      512,
      model,
    )
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/suggest-edit', async (req, res) => {
  try {
    const { content, question, persona, excludedQuestions, model } = req.body

    const exclusionNote = excludedQuestions?.length > 0
      ? `\n\nDo NOT repeat these already-rejected suggestions:\n${excludedQuestions.map(q => `- ${q}`).join('\n')}`
      : ''

    const system = persona
      ? `You are ${persona}. Make targeted, minimal edits — only change what is necessary.`
      : `You are an expert editor. Make targeted, minimal edits — only change what is necessary.`

    // max_tokens scales with document size — cap at 4096
    const maxTokens = Math.min(4096, Math.ceil(content.length / 2))

    const result = await chat(
      system,
      `Edit the document to: ${question}${exclusionNote}

Return the COMPLETE modified document and a brief explanation. Return JSON:
{
  "modifiedContent": "the full modified document text",
  "explanation": "1-2 sentences describing what was changed and why"
}

Document:
${content}`,
      maxTokens,
      model,
    )
    res.json(result)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`BubbleEdit server on http://localhost:${PORT} [model: ${DEFAULT_MODEL}]`))
