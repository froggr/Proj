<template>
  <div class="w-full h-full bg-black flex items-center justify-center overflow-hidden">
    <div v-if="!slide && !isProjector" class="text-gray-500 text-xl">
      No slide selected
    </div>

    <div v-else-if="slide && slide.type === 'image'" class="w-full h-full flex items-center justify-center">
      <img :src="slide.imageUrl" :alt="slide.title" class="max-w-full max-h-full object-contain" />
    </div>

    <div
      v-else-if="slide && slide.type === 'bible'"
      class="w-full h-full flex items-center justify-center p-16"
      :style="{ backgroundColor: slide.background || '#1a1a1a' }"
    >
      <div class="text-center max-w-4xl">
        <div class="text-2xl font-semibold mb-8 text-gray-400">
          {{ slide.reference }}
        </div>
        <div
          class="text-4xl leading-relaxed"
          :style="{ fontFamily: slide.font || 'Inter' }"
        >
          {{ slide.text }}
        </div>
        <div class="text-xl mt-8 text-gray-500">
          {{ slide.translation }}
        </div>
      </div>
    </div>

    <div
      v-else-if="slide && slide.type === 'youtube'"
      class="w-full h-full"
    >
      <iframe
        v-if="youtubeUrl"
        :src="youtubeUrl"
        class="w-full h-full"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
      ></iframe>
    </div>

    <div
      v-else-if="slide && slide.type === 'video'"
      class="w-full h-full flex items-center justify-center bg-black"
    >
      <video
        :src="slide.videoUrl"
        class="max-w-full max-h-full"
        controls
        autoplay
      />
    </div>

    <div
      v-else-if="slide && slide.type === 'canva'"
      class="w-full h-full canva-embed"
    >
      <iframe
        :srcdoc="slide.html"
        class="w-full h-full"
        frameborder="0"
        sandbox="allow-scripts allow-same-origin"
      ></iframe>
    </div>

    <div v-else-if="slide" class="text-gray-500 text-xl">
      Unknown slide type: {{ slide.type }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  slide: {
    type: Object,
    default: null
  },
  isProjector: {
    type: Boolean,
    default: false
  }
})

const youtubeUrl = computed(() => {
  if (props.slide?.type === 'youtube' && props.slide.videoId) {
    return `https://www.youtube-nocookie.com/embed/${props.slide.videoId}?autoplay=0&controls=1&rel=0&modestbranding=1`
  }
  return null
})
</script>

<style scoped>
/* Hide Canva UI elements during presentation */
.canva-embed :deep(iframe) {
  pointer-events: auto;
}

/* Additional CSS to hide Canva navigation and branding when possible */
.canva-embed :deep(.canva-embed__header),
.canva-embed :deep(.canva-embed__footer),
.canva-embed :deep([class*="nav"]),
.canva-embed :deep([class*="toolbar"]),
.canva-embed :deep([class*="controls"]) {
  display: none !important;
}
</style>
