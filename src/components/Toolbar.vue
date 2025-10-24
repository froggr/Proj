<template>
  <div class="flex items-center gap-4 bg-gray-800 p-4 rounded-lg">
    <button
      @click="$emit('prev')"
      :disabled="!canGoPrev"
      class="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold transition-all hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 min-w-[100px]"
    >
      ← Prev
    </button>

    <button
      @click="$emit('goLive')"
      class="px-8 py-3 bg-green-600 text-white rounded-lg font-bold text-lg transition-all hover:bg-green-500 shadow-lg hover:shadow-xl min-w-[150px]"
    >
      GO LIVE
    </button>

    <button
      @click="$emit('next')"
      :disabled="!canGoNext"
      class="px-6 py-3 bg-gray-700 text-white rounded-lg font-semibold transition-all hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700 min-w-[100px]"
    >
      Next →
    </button>

    <div class="flex-1"></div>

    <button
      @click="$emit('clear')"
      class="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold transition-all hover:bg-red-500"
    >
      Clear (Esc)
    </button>
  </div>

  <div class="mt-2 text-xs text-gray-500 text-center">
    Shortcuts: Space = Go Live | ← → = Navigate | Esc = Clear
  </div>
</template>

<script setup>
defineProps({
  canGoPrev: {
    type: Boolean,
    default: false
  },
  canGoNext: {
    type: Boolean,
    default: false
  }
})

defineEmits(['prev', 'goLive', 'next', 'clear'])
</script>
