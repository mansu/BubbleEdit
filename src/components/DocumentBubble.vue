<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { doc } from '../composables/useDocument.js'
import QuestionSelector from './QuestionSelector.vue'
import QuestionBubble from './QuestionBubble.vue'

const rawMode = ref(false)
const renderedHtml = computed(() => marked(doc.content))
</script>

<template>
  <div class="flex gap-4 h-full">

    <!-- Left: Document bubble -->
    <div class="w-1/2 flex flex-col min-h-0">
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm border-l-4 border-l-blue-500 flex flex-col flex-1 min-h-0 overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-200 shrink-0">
          <div class="flex items-center gap-2">
            <span class="text-blue-500 text-lg">📄</span>
            <span class="font-semibold text-gray-700">Document</span>
            <span v-if="doc.persona" class="text-xs text-gray-400">· {{ doc.persona }}</span>
          </div>
          <button
            @click="rawMode = !rawMode"
            class="text-xs text-gray-500 hover:text-gray-700 bg-white border border-gray-200 rounded px-2 py-1 transition"
          >
            {{ rawMode ? '👁 Preview' : '✏️ Edit Raw' }}
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 min-h-0 overflow-y-auto p-6">
          <textarea
            v-if="rawMode"
            v-model="doc.content"
            class="w-full h-full min-h-64 font-mono text-sm text-gray-800 border border-gray-200 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none bg-gray-50"
          />
          <div v-else class="markdown-body" v-html="renderedHtml" />
        </div>

        <!-- Question selector pinned to bottom -->
        <div class="shrink-0 px-5 pb-5 pt-4 border-t border-gray-100">
          <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Ask a question</p>
          <QuestionSelector :parent-bubble="null" />
        </div>
      </div>
    </div>

    <!-- Right: Question bubbles (scrollable) -->
    <div class="w-1/2 overflow-y-auto min-h-0 space-y-3 pb-4">
      <div
        v-for="bubble in doc.bubbles"
        :key="bubble.id"
      >
        <QuestionBubble :bubble="bubble" />
      </div>

      <div v-if="!doc.bubbles.length" class="flex items-center justify-center h-full text-gray-300 text-sm select-none">
        Question bubbles will appear here
      </div>
    </div>

  </div>
</template>
