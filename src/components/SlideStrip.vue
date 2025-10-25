<template>
  <div class="w-full bg-gray-800 border-t border-gray-700 p-4">
    <div class="flex items-center gap-3">
      <!-- Previous Button -->
      <button
        @click="$emit('prev')"
        :disabled="!canGoPrev"
        class="flex-shrink-0 p-2 rounded-lg transition-colors"
        :class="canGoPrev ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Slides Container -->
      <div class="flex-1 overflow-x-auto">
        <div class="flex gap-3">
          <div
            v-for="(slide, index) in slides"
            :key="index"
            @click="$emit('select', index)"
            class="flex-shrink-0 w-40 h-24 rounded-lg overflow-hidden cursor-pointer transition-all border-2"
            :class="[
              index === stagedIndex ? 'border-yellow-400 ring-2 ring-yellow-400' : 'border-gray-600 hover:border-gray-500',
              index === liveIndex ? 'ring-2 ring-green-500' : ''
            ]"
          >
            <!-- Slide Thumbnail -->
            <div class="w-full h-full bg-black relative">
              <SlidePreview :slide="slide" />

              <!-- Indicators -->
              <div class="absolute top-1 right-1 flex gap-1">
                <div v-if="index === liveIndex" class="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div v-if="index === stagedIndex" class="w-3 h-3 bg-yellow-400 rounded-full"></div>
              </div>

              <!-- Slide Number -->
              <div class="absolute bottom-1 left-1 px-2 py-0.5 bg-black/70 text-white text-xs font-semibold rounded">
                {{ index + 1 }}
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div
            v-if="!slides || slides.length === 0"
            class="flex-shrink-0 w-40 h-24 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-500 text-sm"
          >
            No slides
          </div>
        </div>
      </div>

      <!-- Next Button -->
      <button
        @click="$emit('next')"
        :disabled="!canGoNext"
        class="flex-shrink-0 p-2 rounded-lg transition-colors"
        :class="canGoNext ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'"
      >
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Stack Info -->
    <div v-if="stackTitle" class="mt-2 text-center text-sm text-gray-400">
      {{ stackTitle }} - {{ slides?.length || 0 }} slide{{ slides?.length !== 1 ? 's' : '' }}
    </div>
  </div>
</template>

<script setup>
import SlidePreview from './SlidePreview.vue'

defineProps({
  slides: {
    type: Array,
    default: () => []
  },
  stagedIndex: {
    type: Number,
    default: -1
  },
  liveIndex: {
    type: Number,
    default: -1
  },
  canGoPrev: {
    type: Boolean,
    default: false
  },
  canGoNext: {
    type: Boolean,
    default: false
  },
  stackTitle: {
    type: String,
    default: ''
  }
})

defineEmits(['prev', 'next', 'select'])
</script>
