<script setup>
import { computed } from 'vue'

const props = defineProps({
  hunks: { type: Array, required: true },
  readonly: { type: Boolean, default: false },
})

const hasChanges = computed(() => props.hunks.some(h => h.type === 'change'))

function lines(str) {
  // Split into lines, remove trailing empty line from split
  return str.split('\n').filter((l, i, arr) => i < arr.length - 1 || l !== '')
}
</script>

<template>
  <div class="font-mono text-xs rounded-lg border border-gray-200 overflow-hidden">
    <div v-if="!hasChanges" class="px-4 py-4 text-gray-400 text-sm font-sans italic">
      No changes suggested — document already looks good!
    </div>

    <template v-else v-for="(hunk, i) in hunks" :key="i">
      <!-- Context lines (show up to 3 lines for readability) -->
      <div v-if="hunk.type === 'context'">
        <div
          v-for="(line, j) in lines(hunk.value).slice(-2)"
          :key="j"
          class="px-4 py-0.5 text-gray-400 bg-white leading-5 border-t border-gray-50 first:border-t-0"
        >
          &nbsp;&nbsp;{{ line }}
        </div>
      </div>

      <!-- Change hunk -->
      <div v-else class="border-t border-gray-100 first:border-t-0">
        <!-- Removed lines -->
        <div
          v-for="(line, j) in lines(hunk.removed)"
          :key="`r${j}`"
          class="flex bg-red-50"
        >
          <span class="w-7 text-center text-red-400 select-none shrink-0 leading-5 py-0.5 border-r border-red-100">−</span>
          <span class="text-red-700 py-0.5 px-3 leading-5 whitespace-pre-wrap flex-1">{{ line }}</span>
        </div>

        <!-- Added lines -->
        <div
          v-for="(line, j) in lines(hunk.added)"
          :key="`a${j}`"
          class="flex bg-green-50"
        >
          <span class="w-7 text-center text-green-500 select-none shrink-0 leading-5 py-0.5 border-r border-green-100">+</span>
          <span class="text-green-800 py-0.5 px-3 leading-5 whitespace-pre-wrap flex-1">{{ line }}</span>
        </div>

        <!-- Per-hunk decision buttons -->
        <div v-if="!readonly" class="flex items-center gap-2 px-3 py-1.5 bg-gray-50 border-t border-gray-100">
          <template v-if="hunk.accepted === null">
            <button
              @click="hunk.accepted = true"
              class="text-xs px-2 py-0.5 text-green-700 bg-green-100 hover:bg-green-200 rounded transition"
            >
              ✓ Accept
            </button>
            <button
              @click="hunk.accepted = false"
              class="text-xs px-2 py-0.5 text-red-600 bg-red-100 hover:bg-red-200 rounded transition"
            >
              ✗ Reject
            </button>
          </template>
          <template v-else>
            <span :class="hunk.accepted ? 'text-green-600' : 'text-red-500'" class="text-xs">
              {{ hunk.accepted ? '✓ Accepted' : '✗ Rejected' }}
            </span>
            <button
              @click="hunk.accepted = null"
              class="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              undo
            </button>
          </template>
        </div>
        <div v-else-if="hunk.accepted !== null" class="px-3 py-1.5 bg-gray-50 border-t border-gray-100">
          <span :class="hunk.accepted ? 'text-green-600' : 'text-red-500'" class="text-xs">
            {{ hunk.accepted ? '✓ Accepted' : '✗ Rejected' }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
