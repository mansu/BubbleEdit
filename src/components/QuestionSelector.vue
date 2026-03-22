<script setup>
import { ref, computed } from 'vue'
import {
  doc,
  activeBubbleId,
  STANDARD_QUESTIONS,
  createBubble,
  addRootBubble,
  addChildBubble,
  computeBubbleHunks,
  getBubbleSourceContent,
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

function ask() {
  if (!question.value) return
  errorMsg.value = ''

  const sourceContent = getBubbleSourceContent(props.parentBubble)
  const bubble = createBubble(question.value, props.parentBubble?.id ?? null, sourceContent)

  if (props.parentBubble) {
    addChildBubble(props.parentBubble, bubble)
  } else {
    addRootBubble(bubble)
    activeBubbleId.value = bubble.id
  }

  selected.value = ''
  custom.value = ''

  suggestEdit(sourceContent, bubble.question, doc.persona, getExcludedQuestions())
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
    <!-- Expert questions as a compact native listbox -->
    <div v-if="doc.domainQuestions.length">
      <p class="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Expert: {{ doc.domain }}</p>
      <select
        v-model="selected"
        @change="custom = ''"
        :size="Math.min(doc.domainQuestions.length, 4)"
        class="w-full text-xs border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
      >
        <option v-for="q in doc.domainQuestions" :key="q" :value="q">{{ q }}</option>
      </select>
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
