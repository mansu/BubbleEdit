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

async function askQuestion(q) {
  if (!q) return
  errorMsg.value = ''

  const bubble = createBubble(q, props.parentBubble?.id ?? null)

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

function ask() {
  askQuestion(question.value)
}
</script>

<template>
  <div class="space-y-2">
    <!-- Expert questions list -->
    <div v-if="doc.domainQuestions.length" class="space-y-1">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide">Expert: {{ doc.domain }}</p>
      <button
        v-for="q in doc.domainQuestions"
        :key="q"
        @click="askQuestion(q)"
        class="w-full text-left text-sm px-3 py-1.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition"
      >
        {{ q }}
      </button>
    </div>

    <!-- Standard question dropdown + Ask -->
    <div class="flex gap-2">
      <select
        v-model="selected"
        @change="custom = ''"
        class="flex-1 min-w-0 text-sm border border-gray-200 rounded-lg px-3 py-2 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option value="">Choose a question…</option>
        <option v-for="q in STANDARD_QUESTIONS" :key="q" :value="q">{{ q }}</option>
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
