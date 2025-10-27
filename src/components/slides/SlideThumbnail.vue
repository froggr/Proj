<template>
  <div class="w-full h-full bg-black">
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

    <!-- Video: Show video element as poster (no autoplay, no controls) -->
    <video
      v-else-if="slide.type === 'video' && resolvedVideoUrl"
      :src="resolvedVideoUrl"
      class="w-full h-full object-contain"
      preload="metadata"
    />

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

// Resolve video URL for video thumbnails
watch(() => [props.slide, props.libraryRoot], async ([newSlide]) => {
  if (newSlide?.type === 'video' && newSlide.videoUrl) {
    resolvedVideoUrl.value = await resolveAssetUrl(newSlide.videoUrl, props.libraryRoot)
  } else {
    resolvedVideoUrl.value = null
  }
}, { immediate: true })
</script>
