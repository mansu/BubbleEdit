<script setup>
import { ref } from 'vue'
import { doc, settings, MODELS } from './composables/useDocument.js'
import { detectDomain, generateQuestions } from './services/api.js'
import DocumentBubble from './components/DocumentBubble.vue'

const detecting = ref(false)
const error = ref(null)
const hasFileAPI = typeof window !== 'undefined' && 'showOpenFilePicker' in window

async function openFile() {
  error.value = null
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md', '.markdown', '.txt'] } }],
    })
    const file = await handle.getFile()
    const content = await file.text()

    doc.fileHandle = handle
    doc.fileName = file.name
    doc.content = content
    doc.bubbles = []
    doc.domain = null
    doc.persona = null
    doc.domainQuestions = []

    // Auto-detect domain in the background — non-blocking
    detecting.value = true
    try {
      const { domain, persona } = await detectDomain(content)
      doc.domain = domain
      doc.persona = persona
      const { questions } = await generateQuestions(content, domain, persona)
      doc.domainQuestions = questions ?? []
    } catch (e) {
      console.warn('Domain detection skipped:', e.message)
    } finally {
      detecting.value = false
    }
  } catch (e) {
    if (e.name !== 'AbortError') error.value = e.message
  }
}

async function saveFile() {
  if (!doc.fileHandle) return
  try {
    const writable = await doc.fileHandle.createWritable()
    await writable.write(doc.content)
    await writable.close()
  } catch (e) {
    error.value = e.message
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
      <div class="flex items-center gap-3">
        <span class="text-xl font-bold text-blue-600 tracking-tight">BubbleEdit</span>
        <span v-if="doc.fileName" class="text-sm text-gray-500 font-mono">{{ doc.fileName }}</span>
        <span
          v-if="doc.domain"
          class="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-full"
        >
          {{ doc.domain }}
        </span>
        <span v-if="detecting" class="text-xs text-gray-400 animate-pulse">detecting domain…</span>
      </div>
      <div class="flex items-center gap-2">
        <select
          v-model="settings.model"
          class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
          title="AI model"
        >
          <option v-for="m in MODELS" :key="m.id" :value="m.id">
            {{ m.label }} — {{ m.note }}
          </option>
        </select>
        <span v-if="error" class="text-xs text-red-500 mr-2">{{ error }}</span>
        <button
          @click="openFile"
          :disabled="!hasFileAPI"
          class="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 transition"
        >
          Open File
        </button>
        <button
          @click="saveFile"
          :disabled="!doc.fileHandle"
          class="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Save
        </button>
      </div>
    </header>

    <main class="px-4 pt-4 pb-4" style="height:calc(100vh - 56px); overflow:hidden; display:flex; flex-direction:column">
      <!-- Browser not supported -->
      <div v-if="!hasFileAPI" class="text-center py-24 text-gray-500">
        <div class="text-4xl mb-3">⚠️</div>
        <p class="font-medium">File System API not supported in this browser.</p>
        <p class="text-sm mt-1">Use Chrome or Edge to run BubbleEdit.</p>
      </div>

      <!-- Empty state -->
      <div v-else-if="!doc.content" class="text-center py-24">
        <div class="text-5xl mb-4">📝</div>
        <h2 class="text-xl font-semibold text-gray-700 mb-2">No document open</h2>
        <p class="text-gray-400 mb-6 text-sm">Open a markdown file to get started</p>
        <button
          @click="openFile"
          class="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition"
        >
          Open Markdown File
        </button>
      </div>

      <!-- Document + bubble tree -->
      <DocumentBubble v-else class="flex-1 min-h-0" />
    </main>
  </div>
</template>
