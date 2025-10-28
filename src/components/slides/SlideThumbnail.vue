<template>
  <div class="w-full h-full bg-black thumbnail-container">
    <!-- No slide -->
    <div v-if="!slide" class="w-full h-full bg-black"></div>

    <!-- Image, Bible, Custom slides use SlideRenderer -->
    <SlideRenderer
      v-else-if="slide.type === 'image' || slide.type === 'bible' || slide.type === 'custom'"
      :slide="slide"
      :text-scale="textScale"
      :library-root="libraryRoot"
    />

    <!-- YouTube: Show thumbnail image (no iframe for performance) -->
    <img
      v-else-if="slide.type === 'youtube'"
      :src="`https://img.youtube.com/vi/${slide.videoId}/hqdefault.jpg`"
      :alt="slide.title"
      class="w-full h-full object-contain"
      @error="(e) => e.target.src = `https://img.youtube.com/vi/${slide.videoId}/default.jpg`"
    />

    <!-- Video: Show thumbnail if available, otherwise show video poster -->
    <div v-else-if="slide.type === 'video'" class="w-full h-full">
      <!-- Thumbnail image if available -->
      <img
        v-if="resolvedThumbnailUrl"
        :src="resolvedThumbnailUrl"
        :alt="slide.title"
        class="w-full h-full object-contain"
      />
      <!-- Fallback to video element poster (for legacy videos without thumbnails) -->
      <video
        v-else-if="resolvedVideoUrl"
        :src="resolvedVideoUrl"
        class="w-full h-full object-contain"
        preload="metadata"
      />
      <!-- Fallback icon if neither available -->
      <div v-else class="w-full h-full flex items-center justify-center">
        <svg class="w-12 h-12 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    </div>

    <!-- Unknown type -->
    <div v-else class="text-gray-500 text-xs flex items-center justify-center h-full">
      {{ slide.type || 'Unknown' }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import SlideRenderer from './SlideRenderer.vue'
import { resolveAssetUrl } from '@/utils/assetResolver'

const props = defineProps({
  slide: {
    type: Object,
    default: null
  },
  textScale: {
    type: Number,
    default: 100
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const resolvedVideoUrl = ref(null)
const resolvedThumbnailUrl = ref(null)

// Resolve video and thumbnail URLs
watch(() => [props.slide, props.libraryRoot], async ([newSlide]) => {
  if (newSlide?.type === 'video' && newSlide.videoUrl) {
    // Derive thumbnail URL from video URL
    // e.g., "assets://media/2025-10/video.mp4" -> "assets://.thumbnails/video.mp4.jpg"
    const videoFilename = newSlide.videoUrl.split('/').pop() // Get "video.mp4"
    const thumbnailUrl = `assets://.thumbnails/${videoFilename}.jpg`

    console.log('[SlideThumbnail] Video:', newSlide.videoUrl, '-> Thumbnail:', thumbnailUrl)

    // Try to resolve thumbnail URL first (preferred)
    resolvedThumbnailUrl.value = await resolveAssetUrl(thumbnailUrl, props.libraryRoot)
    console.log('[SlideThumbnail] Resolved thumbnail:', resolvedThumbnailUrl.value)

    // Resolve video URL as fallback
    resolvedVideoUrl.value = await resolveAssetUrl(newSlide.videoUrl, props.libraryRoot)
  } else {
    resolvedVideoUrl.value = null
    resolvedThumbnailUrl.value = null
  }
}, { immediate: true })
</script>

<style scoped>
/* Enable container queries for proportional text scaling in thumbnails */
.thumbnail-container {
  container-type: size;
}
</style>
