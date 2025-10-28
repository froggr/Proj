<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
        <h2 class="text-lg font-semibold text-gold-500">Library Manager</h2>
        <button
          @click="handleClose"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Filter -->
      <div class="px-6 py-3 border-b border-neutral-800 flex-shrink-0">
        <div class="flex items-center gap-2">
          <label class="text-sm text-neutral-400">Filter:</label>
          <button
            @click="filterType = 'all'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              filterType === 'all'
                ? 'bg-gold-500 text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            ]"
          >
            All
          </button>
          <button
            @click="filterType = 'images'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              filterType === 'images'
                ? 'bg-gold-500 text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            ]"
          >
            Images
          </button>
          <button
            @click="filterType = 'videos'"
            :class="[
              'px-3 py-1 rounded text-sm transition-colors',
              filterType === 'videos'
                ? 'bg-gold-500 text-black'
                : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
            ]"
          >
            Videos
          </button>
        </div>
      </div>

      <!-- Asset Grid -->
      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="loading" class="flex items-center justify-center h-full">
          <div class="text-neutral-500">Loading assets...</div>
        </div>
        <div v-else-if="filteredAssets.length === 0" class="flex flex-col items-center justify-center h-full">
          <svg class="w-16 h-16 text-neutral-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p class="text-neutral-500">No assets in library</p>
        </div>
        <div v-else class="grid grid-cols-3 gap-6">
          <div
            v-for="asset in filteredAssets"
            :key="asset.url"
            class="group relative bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700 hover:border-neutral-600 transition-all"
          >
            <!-- Preview -->
            <div
              class="aspect-video bg-neutral-900 flex items-center justify-center relative"
              :class="asset.type === 'video' ? 'cursor-pointer' : ''"
              @click="asset.type === 'video' ? openVideoPreview(asset) : null"
            >
              <img
                v-if="asset.type === 'image'"
                :src="'local-image://' + asset.path"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div v-else-if="asset.type === 'video'" class="w-full h-full relative">
                <!-- Thumbnail if available -->
                <img
                  v-if="asset.thumbnailUrl"
                  :src="getAssetUrl(asset.thumbnailUrl)"
                  class="w-full h-full object-cover"
                />
                <!-- Fallback icon if no thumbnail -->
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-16 h-16 text-neutral-600 group-hover:text-gold-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <!-- Click to preview hint -->
                <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div class="text-white text-sm font-medium">Click to Preview</div>
                </div>
              </div>
            </div>

            <!-- Info -->
            <div class="p-3 space-y-2">
              <p class="text-sm text-white font-medium truncate" :title="asset.filename">{{ asset.filename }}</p>
              <div class="text-xs text-neutral-400 space-y-1">
                <p>{{ formatFileSize(asset.size) }}</p>
                <p v-if="asset.metadata?.width && asset.metadata?.height">
                  {{ asset.metadata.width }} × {{ asset.metadata.height }}
                </p>
              </div>
            </div>

            <!-- Delete Button -->
            <button
              @click="confirmDelete(asset)"
              class="absolute top-2 right-2 w-8 h-8 bg-red-600/90 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center"
              title="Delete asset"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between px-6 py-4 border-t border-neutral-800 flex-shrink-0">
        <div class="text-sm text-neutral-400">
          {{ filteredAssets.length }} {{ filterType === 'all' ? 'assets' : filterType }}
        </div>
        <button
          @click="handleClose"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Confirmation Dialog -->
    <div v-if="deleteConfirmation" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/80">
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg p-6">
        <h3 class="text-lg font-semibold text-white mb-4">Delete Asset?</h3>

        <div v-if="checkingUsage" class="text-neutral-400 mb-4">
          Checking if asset is in use...
        </div>

        <div v-else-if="assetUsage.length > 0" class="mb-4">
          <p class="text-yellow-500 font-medium mb-2">⚠️ Warning: This asset is in use!</p>
          <p class="text-neutral-300 mb-3">This asset is used in {{ assetUsage.length }} event(s):</p>
          <ul class="list-disc list-inside text-sm text-neutral-400 space-y-1 mb-4">
            <li v-for="event in assetUsage" :key="event">{{ event }}</li>
          </ul>
          <p class="text-neutral-400 text-sm">
            Deleting this asset will break these events. Slides using this asset will fail to display.
          </p>
        </div>

        <div v-else class="mb-4">
          <p class="text-neutral-300">
            Are you sure you want to delete <span class="font-medium text-white">{{ deleteConfirmation?.filename }}</span>?
          </p>
          <p class="text-sm text-neutral-500 mt-2">This action cannot be undone.</p>
        </div>

        <div class="flex gap-3 justify-end">
          <button
            @click="cancelDelete"
            class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            v-if="!checkingUsage"
            @click="executeDelete"
            class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
          >
            {{ assetUsage.length > 0 ? 'Delete Anyway' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Video Preview Modal -->
    <div v-if="showVideoPreview && previewVideo" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
          <div>
            <h2 class="text-lg font-semibold text-gold-500">Video Preview</h2>
            <p class="text-sm text-neutral-400 mt-1">{{ previewVideo.filename }}</p>
          </div>
          <button
            @click="closeVideoPreview"
            class="text-neutral-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Video Player -->
        <div class="flex-1 overflow-hidden p-6">
          <div class="aspect-video bg-black rounded-lg overflow-hidden">
            <video
              id="library-preview-video"
              :src="'file://' + previewVideo.path"
              class="w-full h-full"
              controls
              preload="metadata"
            ></video>
          </div>

          <!-- Video Info -->
          <div class="mt-4 p-4 bg-neutral-800 rounded-lg">
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span class="text-neutral-400">Size:</span>
                <span class="text-white ml-2">{{ formatFileSize(previewVideo.size) }}</span>
              </div>
              <div v-if="previewVideo.metadata?.width && previewVideo.metadata?.height">
                <span class="text-neutral-400">Dimensions:</span>
                <span class="text-white ml-2">{{ previewVideo.metadata.width }} × {{ previewVideo.metadata.height }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-800 flex-shrink-0">
          <div class="text-sm text-neutral-400">
            Generate a thumbnail from this video
          </div>
          <div class="flex gap-3">
            <button
              @click="closeVideoPreview"
              class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              @click="regenerateThumbnail"
              :disabled="regeneratingThumbnail"
              class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              :class="regeneratingThumbnail ? 'bg-neutral-700 text-neutral-500' : 'bg-gold-500 hover:bg-gold-600 text-black'"
            >
              <svg v-if="regeneratingThumbnail" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{{ regeneratingThumbnail ? 'Generating...' : 'Regenerate Thumbnail' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { extractVideoThumbnail } from '../utils/videoThumbnail.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'asset-deleted'])

const assets = ref([])
const loading = ref(false)
const filterType = ref('all')
const deleteConfirmation = ref(null)
const checkingUsage = ref(false)
const assetUsage = ref([])

// Video preview modal
const showVideoPreview = ref(false)
const previewVideo = ref(null)
const regeneratingThumbnail = ref(false)

const filteredAssets = computed(() => {
  if (filterType.value === 'all') return assets.value
  if (filterType.value === 'images') {
    return assets.value.filter(a => a.type === 'image')
  }
  if (filterType.value === 'videos') {
    return assets.value.filter(a => a.type === 'video')
  }
  return assets.value
})

// Load assets when library root changes or dialog opens
watch([() => props.show, () => props.libraryRoot], async ([isShowing, libRoot]) => {
  if (isShowing && libRoot) {
    await loadAssets()
  }
})

async function loadAssets() {
  if (!props.libraryRoot || !window.electronAPI) {
    return
  }

  loading.value = true
  try {
    const result = await window.electronAPI.listLibraryAssets(props.libraryRoot)
    assets.value = result.assets || []
  } catch (error) {
    console.error('Failed to load library assets:', error)
    assets.value = []
  } finally {
    loading.value = false
  }
}

async function confirmDelete(asset) {
  deleteConfirmation.value = asset
  checkingUsage.value = true
  assetUsage.value = []

  // Check which events use this asset
  try {
    const usage = await window.electronAPI.checkAssetUsage(props.libraryRoot, asset.url)
    assetUsage.value = usage
  } catch (error) {
    console.error('Failed to check asset usage:', error)
  } finally {
    checkingUsage.value = false
  }
}

function cancelDelete() {
  deleteConfirmation.value = null
  assetUsage.value = []
  checkingUsage.value = false
}

async function executeDelete() {
  if (!deleteConfirmation.value) return

  try {
    const result = await window.electronAPI.deleteLibraryAsset(
      props.libraryRoot,
      deleteConfirmation.value.path
    )

    if (result.success) {
      // Remove from local list
      const index = assets.value.findIndex(a => a.path === deleteConfirmation.value.path)
      if (index !== -1) {
        assets.value.splice(index, 1)
      }

      emit('asset-deleted', deleteConfirmation.value)
      cancelDelete()
    } else {
      console.error('Failed to delete asset:', result.error)
      alert('Failed to delete asset: ' + result.error)
    }
  } catch (error) {
    console.error('Error deleting asset:', error)
    alert('Error deleting asset: ' + error.message)
  }
}

function handleClose() {
  emit('close')
}

function handleImageError(e) {
  console.error('Failed to load image preview:', e.target.src)
}

function getAssetUrl(assetUrl) {
  // Convert assets:// URLs to local-image:// for display
  if (assetUrl && assetUrl.startsWith('assets://')) {
    // Extract the relative path after assets://
    const relativePath = assetUrl.replace('assets://', '')
    // Construct full path
    const fullPath = `${props.libraryRoot}/assets/${relativePath}`
    return `local-image://${fullPath}`
  }
  return assetUrl
}

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function openVideoPreview(asset) {
  if (asset.type !== 'video') return

  previewVideo.value = asset
  showVideoPreview.value = true

  // Wait for video element to render
  await nextTick()
}

function closeVideoPreview() {
  showVideoPreview.value = false
  previewVideo.value = null
  regeneratingThumbnail.value = false
}

async function regenerateThumbnail() {
  if (!previewVideo.value || !window.electronAPI) return

  regeneratingThumbnail.value = true

  try {
    // Get the video element
    const videoElement = document.getElementById('library-preview-video')
    if (!videoElement) {
      console.error('Video element not found')
      return
    }

    // Wait for video to load metadata
    await new Promise((resolve, reject) => {
      if (videoElement.readyState >= 1) {
        resolve()
      } else {
        videoElement.addEventListener('loadedmetadata', resolve, { once: true })
        videoElement.addEventListener('error', reject, { once: true })
        setTimeout(() => reject(new Error('Timeout loading video')), 10000)
      }
    })

    console.log('Extracting thumbnail for', previewVideo.value.filename)
    const thumbnailDataUrl = await extractVideoThumbnail(videoElement, 10)

    // Convert videoUrl from path to assets:// URL format
    // e.g., /path/to/library/assets/media/2024-10/video.mp4 -> assets://media/2024-10/video.mp4
    const libraryAssetsPath = props.libraryRoot + '/assets/'
    let videoUrl = previewVideo.value.url

    // If url is not in assets:// format, construct it from path
    if (!videoUrl.startsWith('assets://')) {
      const relativePath = previewVideo.value.path.replace(libraryAssetsPath, '')
      videoUrl = `assets://${relativePath}`
    }

    console.log('Saving thumbnail for video URL:', videoUrl)

    // Save thumbnail via IPC
    const result = await window.electronAPI.saveVideoThumbnail(
      props.libraryRoot,
      videoUrl,
      thumbnailDataUrl
    )

    if (result.success) {
      console.log('Thumbnail saved successfully:', result.thumbnailUrl)

      // Reload assets to show new thumbnail
      await loadAssets()

      // Update the preview video reference
      const updatedAsset = assets.value.find(a => a.path === previewVideo.value.path)
      if (updatedAsset) {
        previewVideo.value = updatedAsset
      }

      alert('Thumbnail regenerated successfully!')
    } else {
      console.error('Failed to save thumbnail:', result.error)
      alert('Failed to save thumbnail: ' + result.error)
    }
  } catch (error) {
    console.error('Error regenerating thumbnail:', error)
    alert('Error regenerating thumbnail: ' + error.message)
  } finally {
    regeneratingThumbnail.value = false
  }
}
</script>
