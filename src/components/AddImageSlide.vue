<template>
  <Modal :show="show" title="Add Image Slide" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Image Source
        </label>
        <div class="space-y-3">
          <button
            @click="selectFile"
            class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Choose File from Computer
          </button>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="px-2 bg-gray-800 text-gray-400">or</span>
            </div>
          </div>

          <input
            v-model="imageUrl"
            type="url"
            placeholder="Paste image URL here"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div v-if="selectedFiles.length > 0">
        <p class="text-sm text-gray-400">
          Selected <span class="text-white font-medium">{{ selectedFiles.length }}</span> image(s)
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Title (optional)
        </label>
        <input
          v-model="title"
          type="text"
          placeholder="e.g., Welcome"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div v-if="imageUrl || selectedFile" class="space-y-2">
        <label class="block text-sm font-medium text-gray-300">
          Preview
        </label>
        <div class="bg-black rounded-lg overflow-hidden">
          <img
            :src="imageUrl || `local-image://${selectedFile}`"
            class="w-full h-auto"
            @error="handleImageError"
          />
        </div>
      </div>

      <div v-if="error" class="p-4 bg-red-900 bg-opacity-30 border border-red-700 rounded-lg">
        <p class="text-red-300">{{ error }}</p>
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
          :disabled="!imageUrl && !selectedFile"
          class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          Add Slide
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'

const emit = defineEmits(['close', 'add'])

defineProps({
  show: Boolean
})

const imageUrl = ref('')
const selectedFile = ref('')
const selectedFiles = ref([])  // For multiple files
const title = ref('')
const error = ref('')

async function selectFile() {
  try {
    if (!window.electronAPI) {
      error.value = 'File dialog not available (Electron API not loaded)'
      return
    }

    // Use Electron's dialog to select multiple images
    const result = await window.electronAPI.selectImages()

    if (result.success && result.files && result.files.length > 0) {
      selectedFiles.value = result.files
      selectedFile.value = result.files[0]  // For preview
      imageUrl.value = '' // Clear URL if file is selected
      error.value = ''
      console.log('Selected files:', result.files)
    } else if (result.canceled) {
      // User canceled, do nothing
    } else {
      error.value = result.error || 'Failed to select files'
    }
  } catch (err) {
    error.value = `Failed to select file: ${err.message}`
    console.error('File selection error:', err)
  }
}

function handleImageError() {
  error.value = 'Failed to load image. Please check the URL or file path.'
}

function addSlide() {
  // If multiple files selected, create multiple slides
  if (selectedFiles.value.length > 1) {
    selectedFiles.value.forEach((filePath, index) => {
      const slide = {
        type: 'image',
        imageUrl: `local-image://${filePath}`,
        title: title.value ? `${title.value} ${index + 1}` : `Image ${index + 1}`
      }
      emit('add', slide)
    })
  } else {
    // Single slide
    const slide = {
      type: 'image',
      imageUrl: imageUrl.value || `local-image://${selectedFile.value}`,
      title: title.value || 'Image Slide'
    }
    emit('add', slide)
  }

  // Reset
  imageUrl.value = ''
  selectedFile.value = ''
  selectedFiles.value = []
  title.value = ''
  error.value = ''
}
</script>
