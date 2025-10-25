<template>
  <Modal :show="show" title="Add Local Video" @close="$emit('close')">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Video Source
        </label>
        <div class="space-y-3">
          <button
            v-if="isLibraryOpen"
            @click="showAssetPicker = true"
            class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            Browse Library
          </button>
          <button
            v-else
            @click="selectFile"
            class="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Choose Video from Computer
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
            v-model="videoUrl"
            type="url"
            placeholder="Paste video URL here"
            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div v-if="selectedFile || selectedAsset">
        <p class="text-sm text-gray-400">
          Selected: <span class="text-white font-medium">{{ selectedAsset ? selectedAsset.filename : selectedFile }}</span>
        </p>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-300 mb-2">
          Title (optional)
        </label>
        <input
          v-model="title"
          type="text"
          placeholder="e.g., Worship Video"
          class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div v-if="videoUrl || selectedFile || selectedAsset" class="space-y-2">
        <label class="block text-sm font-medium text-gray-300">
          Preview
        </label>
        <div class="bg-black rounded-lg overflow-hidden aspect-video">
          <video
            :src="getPreviewUrl()"
            class="w-full h-full"
            controls
            @error="handleVideoError"
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
          :disabled="!videoUrl && !selectedFile && !selectedAsset"
          class="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
        >
          Add Slide
        </button>
      </div>
    </div>
  </Modal>

  <!-- Asset Picker -->
  <AssetPicker
    :show="showAssetPicker"
    :library-root="libraryRoot"
    :asset-type="'video'"
    :title="'Select Video'"
    @close="showAssetPicker = false"
    @select="handleAssetSelect"
  />
</template>

<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import AssetPicker from './AssetPicker.vue'

const emit = defineEmits(['close', 'add'])

const props = defineProps({
  show: Boolean,
  libraryRoot: {
    type: String,
    default: null
  },
  isLibraryOpen: {
    type: Boolean,
    default: false
  }
})

const videoUrl = ref('')
const selectedFile = ref('')
const selectedAsset = ref(null)
const showAssetPicker = ref(false)
const title = ref('')
const error = ref('')

async function selectFile() {
  try {
    if (!window.electronAPI) {
      error.value = 'File dialog not available (Electron API not loaded)'
      return
    }

    // Note: We should add a selectVideos method to electronAPI similar to selectImages
    // For now, fall back to generic file selection
    error.value = 'Please use the library to add videos, or enter a video URL.'
  } catch (err) {
    error.value = `Failed to select file: ${err.message}`
    console.error('File selection error:', err)
  }
}

function handleVideoError() {
  error.value = 'Failed to load video. Please check the URL or file path. Make sure you have the necessary codecs installed.'
}

function handleAssetSelect(asset) {
  selectedAsset.value = asset
  videoUrl.value = ''
  selectedFile.value = ''
  error.value = ''
}

function getPreviewUrl() {
  if (selectedAsset.value) {
    return `file://${selectedAsset.value.path}`
  } else if (videoUrl.value) {
    return videoUrl.value
  } else if (selectedFile.value) {
    return `file://${selectedFile.value}`
  }
  return ''
}

function addSlide() {
  // If library asset selected
  if (selectedAsset.value) {
    const slide = {
      type: 'video',
      videoUrl: selectedAsset.value.url,  // This will be assets://...
      title: title.value || selectedAsset.value.filename
    }
    emit('add', slide)
  }
  // Single file or URL
  else {
    const slide = {
      type: 'video',
      videoUrl: videoUrl.value || `file://${selectedFile.value}`,
      title: title.value || 'Video Slide'
    }
    emit('add', slide)
  }

  // Reset
  videoUrl.value = ''
  selectedFile.value = ''
  selectedAsset.value = null
  title.value = ''
  error.value = ''
}
</script>
