<template>
  <div class="w-full h-full bg-black flex items-center justify-center">
    <!-- No slide -->
    <div v-if="!slide" class="w-full h-full bg-black"></div>

    <!-- Image Slide -->
    <img
      v-else-if="slide.type === 'image' && resolvedImageUrl"
      :src="resolvedImageUrl"
      :alt="slide.title"
      class="w-full h-full object-contain"
      loading="lazy"
    />

    <!-- Bible Slide -->
    <div
      v-else-if="slide.type === 'bible'"
      class="w-full h-full flex items-center justify-center"
      :style="{
        backgroundColor: slide.background || '#1a1a1a',
        padding: '4.5% 10%'
      }"
    >
      <div class="text-center">
        <div
          class="font-semibold text-gray-400"
          :style="{ fontSize: scaledFontSizes.bibleReference, marginBottom: '22px' }"
        >
          {{ slide.reference }}
        </div>
        <div
          :style="{
            fontFamily: slide.font || 'Inter',
            fontSize: scaledFontSizes.bibleText,
            lineHeight: '1.6'
          }"
        >
          {{ slide.text }}
        </div>
        <div
          class="text-gray-500"
          :style="{ fontSize: scaledFontSizes.bibleTranslation, marginTop: '22px' }"
        >
          {{ slide.translation }}
        </div>
      </div>
    </div>

    <!-- Custom Slide -->
    <div
      v-else-if="slide.type === 'custom'"
      class="w-full h-full flex items-center justify-center custom-slide-container"
      :style="{
        backgroundColor: slide.background || '#1a1a1a',
        padding: '4.5% 10%',
        fontSize: scaledFontSizes.customText
      }"
    >
      <div
        class="w-full"
        style="text-align: center; white-space: pre-wrap; line-height: 1.6;"
        v-html="slide.html"
      ></div>
    </div>

    <!-- Unknown Type -->
    <div v-else class="text-gray-500 text-sm">
      Unknown slide type: {{ slide.type }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
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

const resolvedImageUrl = ref(null)

// Compute scaled font sizes based on textScale prop
const scaledFontSizes = computed(() => {
  const multiplier = props.textScale / 100
  return {
    bibleReference: (1.46 * multiplier).toFixed(2) + 'cqw',
    bibleText: (2.5 * multiplier).toFixed(2) + 'cqw',
    bibleTranslation: (1.15 * multiplier).toFixed(2) + 'cqw',
    customText: (2.81 * multiplier).toFixed(2) + 'cqw'
  }
})

// Watch for slide changes and resolve image URLs
watch(() => [props.slide, props.libraryRoot], async ([newSlide]) => {
  if (newSlide?.type === 'image' && newSlide.imageUrl) {
    resolvedImageUrl.value = await resolveAssetUrl(newSlide.imageUrl, props.libraryRoot)
  } else {
    resolvedImageUrl.value = null
  }
}, { immediate: true })
</script>

<style scoped>
/* Custom slide font scaling */
.custom-slide-container :deep(font[size="1"]),
.custom-slide-container :deep(span[style*="font-size: 0.7em"]) {
  font-size: 0.7em !important;
}

.custom-slide-container :deep(font[size="3"]),
.custom-slide-container :deep(span[style*="font-size: 1em"]) {
  font-size: 1em !important;
}

.custom-slide-container :deep(font[size="5"]),
.custom-slide-container :deep(span[style*="font-size: 1.5em"]) {
  font-size: 1.5em !important;
}

.custom-slide-container :deep(font[size="7"]),
.custom-slide-container :deep(span[style*="font-size: 2em"]) {
  font-size: 2em !important;
}
</style>
