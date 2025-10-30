<template>
  <div class="w-full h-full bg-black relative flex items-center justify-center lyrics-container">
    <!-- Background video (if configured) - ONLY on projector, not in control preview -->
    <VideoPlayer
      v-if="!isPreview && slide.backgroundMode === 'single' && slide.backgroundVideo"
      :video-url="slide.backgroundVideo"
      :library-root="libraryRoot"
      :autoplay="true"
      :muted="true"
      :loop="true"
      :show-native-controls="false"
      :broadcast-state="false"
      class="absolute inset-0 w-full h-full object-cover"
      :style="{ opacity: slide.backgroundOpacity || 0.4 }"
    />

    <!-- Lyrics overlay - clean, no section names, no chords, no song info (hidden when lyricsCleared is true or section has no lyrics) -->
    <div v-if="!slide.lyricsCleared && hasLyrics" class="relative z-10 w-full px-12 text-center">
      <div class="space-y-4">
        <div
          v-for="(line, lineIndex) in slide.sectionData.lines"
          :key="lineIndex"
          class="flex justify-center items-center gap-2 flex-wrap"
        >
          <span
            v-for="(pair, pairIndex) in line"
            :key="pairIndex"
            class="lyrics-word"
            :style="{
              fontSize: `${baseFontSize}cqw`,
              fontFamily: slide.fontFamily || 'Inter, sans-serif',
              fontWeight: slide.fontWeight || 600,
              color: '#ffffff',
              textShadow: slide.textShadow || '2px 2px 8px rgba(0, 0, 0, 0.9), 0 0 25px rgba(0, 0, 0, 0.7)',
              letterSpacing: '0.02em',
              lineHeight: 1.2
            }"
          >
            {{ pair[1] || '\u00A0' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import VideoPlayer from './VideoPlayer.vue'

const props = defineProps({
  slide: {
    type: Object,
    required: true
  },
  libraryRoot: {
    type: String,
    default: null
  },
  textScale: {
    type: Number,
    default: 100
  },
  isPreview: {
    type: Boolean,
    default: false
  }
})

// Check if section has lyrics
const hasLyrics = computed(() => {
  if (!props.slide.sectionData) return false
  if (!props.slide.sectionData.lines || props.slide.sectionData.lines.length === 0) return false

  // Check if any line has actual text (not just empty pairs)
  return props.slide.sectionData.lines.some(line =>
    line.some(pair => pair[1] && pair[1].trim().length > 0)
  )
})

// Base font size using container query units (cqw) for proportional scaling
// This will be affected by the text scale setting
const baseFontSize = computed(() => {
  // Base size in container query width units (same as bible/custom slides)
  // Default is 2.5, scaled by textScale
  const multiplier = props.textScale / 100
  return (2.5 * multiplier).toFixed(2)
})
</script>

<style scoped>
/* Enable container queries for proportional text scaling */
.lyrics-container {
  container-type: size;
}

.lyrics-word {
  display: inline-block;
}
</style>
