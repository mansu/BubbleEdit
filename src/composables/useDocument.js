import { reactive } from 'vue'
import { diffLines } from 'diff'

let nextId = 1
export const uid = () => String(nextId++)

export const MODELS = [
  { id: 'claude-haiku-4-5-20251001', label: 'Haiku',  note: 'Fast · Cheap' },
  { id: 'claude-sonnet-4-6',         label: 'Sonnet', note: 'Balanced' },
  { id: 'claude-opus-4-6',           label: 'Opus',   note: 'Best · Expensive' },
]

export const settings = reactive({
  model: MODELS[0].id,
})

export const STANDARD_QUESTIONS = [
  'Fix grammar and spelling',
  'Make it more concise',
  'Improve clarity and flow',
  'Strengthen the argument',
  'Check for contradictions or logical gaps',
  'Simplify for a general audience',
  'Make the tone more formal',
  'Make it more persuasive',
]

// Singleton document state shared across all components
export const doc = reactive({
  fileHandle: null,
  fileName: null,
  content: '',          // live working content (updated on accept)
  domain: null,
  persona: null,
  domainQuestions: [],
  bubbles: [],          // root-level question bubbles
})

// Create a new bubble (snapshot of current content taken at creation time)
export function createBubble(question, parentId = null) {
  return reactive({
    id: uid(),
    parentId,
    question,
    status: 'loading',   // loading | open | accepted | rejected | closed | error
    explanation: '',
    baseContent: doc.content,   // snapshot when bubble was created
    hunks: [],                  // computed diff hunks
    children: [],
  })
}

// Compute diff hunks from AI's modified content and store on bubble
export function computeBubbleHunks(bubble, modifiedContent) {
  const raw = diffLines(bubble.baseContent, modifiedContent)
  const hunks = []

  let i = 0
  while (i < raw.length) {
    const c = raw[i]
    if (!c.added && !c.removed) {
      hunks.push({ type: 'context', value: c.value })
      i++
    } else {
      let removed = ''
      let added = ''
      while (i < raw.length && (raw[i].added || raw[i].removed)) {
        if (raw[i].removed) removed += raw[i].value
        if (raw[i].added) added += raw[i].value
        i++
      }
      // Skip hunks where content is identical (e.g. whitespace-only diff artifacts)
      if (removed === added) {
        hunks.push({ type: 'context', value: removed })
        continue
      }
      // accepted: null = undecided, true = accepted, false = rejected
      hunks.push({ type: 'change', removed, added, accepted: null })
    }
  }

  bubble.hunks = hunks
  bubble.status = 'open'
}

// Apply accepted/rejected hunk decisions to produce the final content for this bubble
export function getBubbleResult(bubble) {
  return bubble.hunks
    .map(h => {
      if (h.type === 'context') return h.value
      // accepted true → use suggested, anything else → use original
      return h.accepted === true ? h.added : h.removed
    })
    .join('')
}

export function addRootBubble(bubble) {
  doc.bubbles.push(bubble)
}

export function addChildBubble(parent, child) {
  parent.children.push(child)
}

// Accept: finalize all undecided hunks as accepted, update live content
export function acceptBubble(bubble) {
  bubble.hunks.forEach(h => {
    if (h.type === 'change' && h.accepted === null) h.accepted = true
  })
  bubble.status = 'accepted'
  doc.content = getBubbleResult(bubble)
}

// Reject: no content change, mark closed for AI exclusion
export function rejectBubble(bubble) {
  bubble.status = 'rejected'
}

// Close: hides bubble and excludes its question from future AI calls
export function closeBubble(bubble) {
  bubble.status = 'closed'
}

// Collect questions from closed/rejected bubbles to exclude from AI prompts
export function getExcludedQuestions(bubbles = doc.bubbles) {
  const result = []
  for (const b of bubbles) {
    if (b.status === 'closed' || b.status === 'rejected') {
      result.push(b.question)
    }
    result.push(...getExcludedQuestions(b.children))
  }
  return result
}
