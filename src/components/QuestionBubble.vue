<script setup>
import { ref, computed } from 'vue'
import { acceptBubble, rejectBubble, closeBubble, activeBubbleId, setPreviewBubble } from '../composables/useDocument.js'
import DiffView from './DiffView.vue'
import QuestionSelector from './QuestionSelector.vue'
import QuestionBubble from './QuestionBubble.vue'

const props = defineProps({
  bubble: { type: Object, required: true },
  isRoot: { type: Boolean, default: false },
})

const localCollapsed = ref(false)
const collapsed = computed(() => props.isRoot ? activeBubbleId.value !== props.bubble.id : localCollapsed.value)

function toggle() {
  if (props.isRoot) {
    activeBubbleId.value = activeBubbleId.value === props.bubble.id ? null : props.bubble.id
  } else {
    localCollapsed.value = !localCollapsed.value
  }
}

function previewCurrentBubble() {
  setPreviewBubble(props.bubble)
}

const borderColor = {
  loading:  'border-l-yellow-300',
  open:     'border-l-blue-400',
  accepted: 'border-l-green-500',
  rejected: 'border-l-red-400',
  closed:   'border-l-gray-300',
  error:    'border-l-red-500',
}
</script>

<template>
  <div v-if="bubble.status !== 'closed'">
    <div
      class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden border-l-4"
      :class="borderColor[bubble.status]"
    >
      <!-- Header — click to collapse/expand -->
      <div
        class="flex items-start justify-between px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer select-none"
        :class="{ 'border-b-0': collapsed }"
        @click.self="toggle"
      >
        <div class="flex-1 min-w-0" @click="toggle">
          <div class="flex items-center gap-2">
            <span class="text-gray-400 text-xs transition-transform" :class="collapsed ? 'rotate-0' : 'rotate-90'">▶</span>
            <span class="text-purple-400 font-bold text-xs shrink-0">Q</span>
            <span class="font-medium text-gray-800 text-sm truncate">{{ bubble.question }}</span>
          </div>
          <p v-if="!collapsed && bubble.explanation" class="text-xs text-gray-500 mt-1 ml-8 leading-relaxed">
            {{ bubble.explanation }}
          </p>
          <p v-if="!collapsed && bubble.status === 'accepted'" class="text-xs text-green-600 mt-0.5 ml-8">
            ✓ Edits accepted and applied
          </p>
          <p v-else-if="!collapsed && bubble.status === 'rejected'" class="text-xs text-red-400 mt-0.5 ml-8">
            ✗ Rejected — excluded from future suggestions
          </p>
        </div>
        <button
          @click.stop="closeBubble(bubble)"
          class="text-gray-300 hover:text-gray-500 text-xl leading-none ml-3 shrink-0 transition"
          title="Close bubble"
        >×</button>
      </div>

      <!-- Collapsible body -->
      <template v-if="!collapsed">
        <!-- Loading -->
        <div v-if="bubble.status === 'loading'" class="px-4 py-8 text-center">
          <div class="text-gray-400 text-sm animate-pulse">Generating suggestions…</div>
        </div>

        <!-- Error -->
        <div v-else-if="bubble.status === 'error'" class="px-4 py-4 text-sm text-red-500">
          {{ bubble.explanation || 'An unexpected error occurred.' }}
        </div>

        <!-- Diff view -->
        <div v-else-if="bubble.hunks.length" class="px-4 pt-4">
          <DiffView
            :bubble="bubble"
            :hunks="bubble.hunks"
            :readonly="bubble.status !== 'open'"
            @change="previewCurrentBubble"
          />
        </div>

        <!-- Action buttons -->
        <div v-if="bubble.status === 'open'" class="px-4 py-4 flex gap-2">
          <button
            @click="acceptBubble(bubble)"
            class="px-4 py-1.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
          >
            ✓ Accept All
          </button>
          <button
            @click="rejectBubble(bubble)"
            class="px-4 py-1.5 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition"
          >
            ✗ Reject
          </button>
        </div>

        <!-- Follow-up questions -->
        <div
          v-if="bubble.status === 'open' || bubble.status === 'accepted'"
          class="px-4 pb-4 border-t border-gray-100 pt-3"
        >
          <p class="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Follow-up question</p>
          <QuestionSelector :parent-bubble="bubble" />
        </div>
      </template>
    </div>

    <!-- Child bubbles -->
    <div v-if="bubble.children.length" class="mt-3 space-y-3">
      <div
        v-for="child in bubble.children"
        :key="child.id"
        class="pl-5 border-l-2 border-gray-200"
      >
        <QuestionBubble :bubble="child" />
      </div>
    </div>
  </div>
</template>
