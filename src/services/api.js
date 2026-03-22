import { settings } from '../composables/useDocument.js'

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, model: settings.model }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `Request failed: ${res.status}`)
  }
  return res.json()
}

export function detectDomain(content) {
  return post('/api/detect-domain', { content })
}

export function generateQuestions(content, domain, persona) {
  return post('/api/generate-questions', { content, domain, persona })
}

export function suggestEdit(content, question, persona, excludedQuestions) {
  return post('/api/suggest-edit', { content, question, persona, excludedQuestions })
}
