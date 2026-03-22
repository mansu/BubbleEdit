<script setup>
import { ref, computed } from 'vue'
import {
  doc,
  STANDARD_QUESTIONS,
  createBubble,
  addRootBubble,
  addChildBubble,
  computeBubbleHunks,
  getExcludedQuestions,
} from '../composables/useDocument.js'
import { suggestEdit } from '../services/api.js'

const props = defineProps({
  parentBubble: { type: Object, default: null },
})

const selected = ref('')
const custom = ref('')
const errorMsg = ref('')

const question = computed(() => custom.value.trim() || selected.value)

const allQuestions = computed(() => {
  return [
    { group: 'Standard', items: STANDARD_QUESTIONS },
    ...(doc.domainQuestions.length
      ? [{ group: `Expert: ${doc.domain}`, items: doc.domainQuestions }]
      : []),
  ]
})

async function ask() {
  if (!question.value) return
  errorMsg.value = ''

  const bubble = createBubble(question.value, props.parentBubble?.id ?? null)

  if (props.parentBubble) {
    addChildBubble(props.parentBubble, bubble)
  } else {
    addRootBubble(bubble)
  }

  selected.value = ''
  custom.value = ''

  // Fire and forget — bubble tracks its own loading state
  suggestEdit(doc.content, bubble.question, doc.persona, getExcludedQuestions())
    .then(result => {
      computeBubbleHunks(bubble, result.modifiedContent)
      bubble.explanation = result.explanation
    })
    .catch(e => {
      bubble.status = 'error'
      bubble.explanation = e.message
    })
}
</script>

<template>
  <div class="space-y-2">
    <div class="flex gap-2">
      <select
        v-model="selected"
        @change="custom = ''"
        class="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">Choose a question…</option>
        <optgroup v-for="group in allQuestions" :key="group.group" :label="group.group">
          <option v-for="q in group.items" :key="q" :value="q">{{ q }}</option>
        </optgroup>
      </select>
      <button
        @click="ask"
        :disabled="!question"
        class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition min-w-[60px]"
      >
        Ask
      </button>
    </div>

    <input
      v-model="custom"
      @keydown.enter="ask"
      placeholder="Or type a custom question and press Enter…"
      class="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-300"
    />

    <p v-if="errorMsg" class="text-xs text-red-500">{{ errorMsg }}</p>
  </div>
</template>
