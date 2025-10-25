<template>
  <Modal :show="show" :title="initialSlide ? 'Edit YouTube Video' : 'Add YouTube Video'" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          YouTube URL
        </label>
        <input
          v-model="youtubeUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
          @input="extractVideoId"
        />
      </div>

      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Title (optional)
        </label>
        <input
          v-model="title"
          type="text"
          placeholder="e.g., Worship Song"
          class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
        />
      </div>

      <div v-if="videoId" class="space-y-2">
        <label class="block text-sm font-medium text-neutral-300">
          Preview
        </label>
        <div class="bg-black rounded-lg overflow-hidden aspect-video">
          <iframe
            :src="`https://www.youtube.com/embed/${videoId}`"
            class="w-full h-full"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
      </div>

    </div>

    <template #footer>
      <button
        @click="$emit('close')"
        class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
      >
        Cancel
      </button>
      <button
        @click="addSlide"
        :disabled="!videoId"
        class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="videoId ? 'bg-gold-500 hover:bg-gold-600 text-black' : 'bg-neutral-600 text-neutral-400'"
      >
        {{ initialSlide ? 'Update Slide' : 'Add Slide' }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch } from 'vue'
import Modal from './Modal.vue'

const emit = defineEmits(['close', 'add'])

const props = defineProps({
  show: Boolean,
  initialSlide: {
    type: Object,
    default: null
  }
})

const youtubeUrl = ref('')
const title = ref('')
const videoId = ref('')

// Watch for initialSlide changes to populate form when editing
watch(() => props.initialSlide, (slide) => {
  if (slide && slide.type === 'youtube') {
    videoId.value = slide.videoId || ''
    title.value = slide.title || ''
    youtubeUrl.value = `https://www.youtube.com/watch?v=${slide.videoId}`
  }
}, { immediate: true })

function extractVideoId() {
  const url = youtubeUrl.value
  if (!url) {
    videoId.value = ''
    return
  }

  // Extract video ID from various YouTube URL formats
  let id = ''

  // Format: https://www.youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) {
    id = watchMatch[1]
  }

  // Format: https://youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (shortMatch) {
    id = shortMatch[1]
  }

  // Format: https://www.youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/\/embed\/([^?]+)/)
  if (embedMatch) {
    id = embedMatch[1]
  }

  videoId.value = id
}

function addSlide() {
  const slide = {
    type: 'youtube',
    videoId: videoId.value,
    title: title.value || 'YouTube Video'
  }

  emit('add', slide)

  // Reset
  youtubeUrl.value = ''
  title.value = ''
  videoId.value = ''
}
</script>
