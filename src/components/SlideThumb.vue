<template>
  <div
    @click="$emit('click')"
    class="relative cursor-pointer bg-gray-800 rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-gray-600"
    :class="{
      'ring-4 ring-yellow-400': isStaged,
      'ring-2 ring-green-500': isLive && !isStaged
    }"
  >
    <div class="aspect-video w-full bg-gray-900 flex items-center justify-center p-4">
      <div v-if="slide.type === 'image'" class="w-full h-full flex items-center justify-center">
        <img :src="resolvedImageUrl || slide.imageUrl" :alt="slide.title" class="max-w-full max-h-full object-contain" />
      </div>
      <div v-else-if="slide.type === 'bible'" class="text-center text-xs text-gray-300">
        <div class="font-semibold mb-1">{{ slide.reference }}</div>
        <div class="line-clamp-3">{{ slide.text }}</div>
      </div>
      <div v-else-if="slide.type === 'youtube'" class="text-center">
        <div class="text-red-500 text-2xl mb-2">▶</div>
        <div class="text-xs text-gray-300">{{ slide.title }}</div>
      </div>
      <div v-else-if="slide.type === 'canva'" class="text-center text-xs text-gray-300">
        <div class="text-purple-500 text-2xl mb-2">🎨</div>
        <div>{{ slide.title }}</div>
      </div>
    </div>

    <div class="absolute top-2 right-2 flex gap-1">
      <div
        v-if="isLive"
        class="w-3 h-3 bg-green-500 rounded-full shadow-lg"
        title="LIVE"
      ></div>
    </div>

    <div class="px-2 py-1 text-xs text-gray-300 truncate bg-gray-900">
      {{ slide.title || slide.reference || 'Untitled' }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  slide: {
    type: Object,
    required: true
  },
  isStaged: {
    type: Boolean,
    default: false
  },
  isLive: {
    type: Boolean,
    default: false
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

defineEmits(['click'])

const resolvedImageUrl = ref(null)

// Resolve various URL formats to local-image:// URLs
async function resolveAssetUrl(assetUrl) {
  if (!assetUrl) {
    return assetUrl
  }

  // Already a local-image:// URL, return as-is
  if (assetUrl.startsWith('local-image://')) {
    return assetUrl
  }

  // Handle file:// URLs or assets:// URLs that need resolving
  if (assetUrl.startsWith('assets://') || assetUrl.startsWith('file://')) {
    if (!props.libraryRoot || !window.electronAPI) {
      return assetUrl
    }

    try {
      const resolvedUrl = await window.electronAPI.resolveAssetPath(props.libraryRoot, assetUrl)
      return resolvedUrl || assetUrl
    } catch (error) {
      console.error('Failed to resolve asset URL:', error)
      return assetUrl
    }
  }

  // Return other URLs unchanged
  return assetUrl
}

// Watch for slide changes and resolve URLs
watch(() => props.slide, async (newSlide) => {
  if (newSlide?.type === 'image' && newSlide.imageUrl) {
    resolvedImageUrl.value = await resolveAssetUrl(newSlide.imageUrl)
  }
}, { immediate: true })
</script>
