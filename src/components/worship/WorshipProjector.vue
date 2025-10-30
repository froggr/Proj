<template>
  <div class="w-full h-full bg-black relative overflow-hidden">
    <!-- Background Video Layer (Dual Video for Crossfade) -->
    <div class="absolute inset-0">
      <!-- Video A -->
      <video
        v-if="videoA"
        ref="videoAElement"
        :src="resolveVideoUrl(videoA)"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-3000"
        :class="{ 'opacity-100': activeVideo === 'A', 'opacity-0': activeVideo !== 'A' }"
        :style="{ opacity: videoOpacity }"
        autoplay
        loop
        muted
        playsinline
      ></video>

      <!-- Video B -->
      <video
        v-if="videoB"
        ref="videoBElement"
        :src="resolveVideoUrl(videoB)"
        class="absolute inset-0 w-full h-full object-cover transition-opacity duration-3000"
        :class="{ 'opacity-100': activeVideo === 'B', 'opacity-0': activeVideo !== 'B' }"
        :style="{ opacity: videoOpacity }"
        autoplay
        loop
        muted
        playsinline
      ></video>
    </div>

    <!-- Lyrics Overlay (hidden when lyricsCleared is true) -->
    <div
      v-if="section && !lyricsCleared"
      class="absolute inset-0 flex items-center justify-center p-[4.5%]"
    >
      <div class="text-center max-w-full">
        <!-- Section Title -->
        <div
          v-if="showSectionTitle"
          class="text-gold-400 font-semibold mb-8 opacity-80"
          :style="{ fontSize: scaledFontSizes.sectionTitle }"
        >
          {{ section.title }}
        </div>

        <!-- Lyrics Lines -->
        <div class="space-y-4">
          <div
            v-for="(line, lineIndex) in section.lines"
            :key="lineIndex"
            class="flex justify-center items-center gap-3"
          >
            <!-- Each [chord, lyric] pair -->
            <div
              v-for="(pair, pairIndex) in line"
              :key="pairIndex"
              class="inline-flex flex-col items-center"
            >
              <!-- Chord (hidden from audience) -->
              <div class="opacity-0 h-0 overflow-hidden">{{ pair[0] }}</div>

              <!-- Lyric -->
              <div
                class="text-white font-medium leading-relaxed"
                :style="{
                  fontSize: scaledFontSizes.lyrics,
                  fontFamily: fontFamily,
                  textShadow: '2px 2px 8px rgba(0, 0, 0, 0.8)'
                }"
              >
                {{ pair[1] }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Black Screen (when no section is live) -->
    <div
      v-if="!section"
      class="absolute inset-0 bg-black flex items-center justify-center"
    >
      <div class="text-neutral-600 text-2xl">
        <!-- Optional: Could show a logo or message here -->
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { resolveAssetUrl } from '@/utils/assetResolver'

const props = defineProps({
  section: {
    type: Object,
    default: null
  },
  backgroundVideo: {
    type: String,
    default: null
  },
  nextBackgroundVideo: {
    type: String,
    default: null
  },
  textScale: {
    type: Number,
    default: 100
  },
  libraryRoot: {
    type: String,
    default: null
  },
  showSectionTitle: {
    type: Boolean,
    default: true
  },
  fontFamily: {
    type: String,
    default: 'Inter, system-ui, sans-serif'
  },
  videoOpacity: {
    type: Number,
    default: 0.6 // Default medium opacity for background video
  },
  lyricsCleared: {
    type: Boolean,
    default: false
  }
})

// Dual video system for crossfade
const videoA = ref(null)
const videoB = ref(null)
const activeVideo = ref('A') // 'A' or 'B'

const videoAElement = ref(null)
const videoBElement = ref(null)

// Initialize first video
watch(() => props.backgroundVideo, (newVideo) => {
  if (!newVideo) return

  // First load
  if (!videoA.value && !videoB.value) {
    videoA.value = newVideo
    activeVideo.value = 'A'
    return
  }

  // Crossfade: load into inactive video slot, then switch
  if (activeVideo.value === 'A') {
    videoB.value = newVideo
    // Wait for video to load
    nextTick(() => {
      setTimeout(() => {
        activeVideo.value = 'B'
      }, 100)
    })
  } else {
    videoA.value = newVideo
    nextTick(() => {
      setTimeout(() => {
        activeVideo.value = 'A'
      }, 100)
    })
  }
}, { immediate: true })

// Scaled font sizes based on textScale prop
const scaledFontSizes = computed(() => {
  const multiplier = props.textScale / 100
  return {
    sectionTitle: (1.8 * multiplier).toFixed(2) + 'cqw',
    lyrics: (3.5 * multiplier).toFixed(2) + 'cqw'
  }
})

// Resolve video URL to full path
function resolveVideoUrl(videoUrl) {
  if (!videoUrl) return null

  // If it's an assets:// URL, resolve it
  if (videoUrl.startsWith('assets://')) {
    return resolveAssetUrl(videoUrl, props.libraryRoot)
  }

  // If it's already a full path or file:// URL
  return videoUrl
}
</script>

<style scoped>
/* Smooth crossfade transition */
.duration-3000 {
  transition-duration: 3000ms;
}

/* Container query for responsive text sizing */
.text-center {
  container-type: inline-size;
}
</style>
