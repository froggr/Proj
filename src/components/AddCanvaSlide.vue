<template>
  <Modal :show="show" title="Add Canva Presentation" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Canva Presentation URL
        </label>
        <input
          v-model="canvaUrl"
          type="url"
          placeholder="https://www.canva.com/design/..."
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          @input="processUrl"
        />
        <p class="mt-2 text-xs text-gray-400">
          Paste a public Canva view or embed link. We'll embed it directly.
        </p>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <div class="text-blue-400">Loading Canva presentation...</div>
      </div>

      <div v-if="error" class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
        <p class="text-sm text-red-300">{{ error }}</p>
      </div>

      <div v-if="canvaHtml && !loading" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Presentation Title
          </label>
          <input
            v-model="slideTitle"
            type="text"
            placeholder="e.g., Welcome Slides"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div class="bg-black rounded-lg overflow-hidden aspect-video">
            <iframe
              :srcdoc="canvaHtml"
              class="w-full h-full"
              frameborder="0"
              sandbox="allow-scripts allow-same-origin"
            ></iframe>
          </div>
          <p class="mt-2 text-xs text-gray-400">
            Canva presentation loaded successfully.
          </p>
        </div>

        <div class="p-4 bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg">
          <p class="text-sm text-blue-300">
            <strong>Tip:</strong> The presentation content is stored in your slide deck.
          </p>
        </div>
      </div>

      <div class="flex gap-3 justify-end pt-4">
        <button
          @click="$emit('close')"
          class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
        >
          Cancel
        </button>
        <button
          @click="addSlide"
          :disabled="!canvaHtml || loading"
          class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          Add Presentation
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'
import Modal from './Modal.vue'

const emit = defineEmits(['close', 'add'])

defineProps({
  show: Boolean
})

const canvaUrl = ref('')
const canvaHtml = ref('')
const slideTitle = ref('')
const loading = ref(false)
const error = ref('')

async function processUrl() {
  const url = canvaUrl.value.trim()
  if (!url) {
    canvaHtml.value = ''
    return
  }

  loading.value = true
  error.value = ''

  try {
    // Fetch Canva content via Tauri backend - returns HTML
    const html = await invoke('fetch_canva_content', { url })
    canvaHtml.value = html
    console.log('Canva HTML loaded, length:', html.length)
  } catch (err) {
    console.error('Failed to fetch Canva content:', err)
    error.value = `Failed to load Canva presentation: ${err}`
    canvaHtml.value = ''
  } finally {
    loading.value = false
  }
}

function addSlide() {
  const slide = {
    type: 'canva',
    html: canvaHtml.value,  // Store HTML content
    sourceUrl: canvaUrl.value,
    title: slideTitle.value || 'Canva Presentation'
  }

  emit('add', slide)

  // Reset
  canvaUrl.value = ''
  canvaHtml.value = ''
  slideTitle.value = ''
  error.value = ''
}
</script>
