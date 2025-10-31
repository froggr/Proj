<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
        <h2 class="text-lg font-semibold text-gold-500">{{ title }}</h2>
        <button
          @click="handleClose"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Tabs -->
      <div class="flex border-b border-neutral-800 flex-shrink-0">
        <button
          @click="activeTab = 'browse'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'browse'
              ? 'text-gold-500 border-b-2 border-gold-500'
              : 'text-neutral-400 hover:text-white'
          ]"
        >
          Browse Library
        </button>
        <button
          @click="activeTab = 'import'"
          :class="[
            'px-6 py-3 font-medium transition-colors',
            activeTab === 'import'
              ? 'text-gold-500 border-b-2 border-gold-500'
              : 'text-neutral-400 hover:text-white'
          ]"
        >
          Import New
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-hidden">
        <!-- Browse Library Tab -->
        <div v-if="activeTab === 'browse'" class="h-full flex flex-col">
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
              <p class="text-neutral-500">No assets in library yet</p>
              <p class="text-sm text-neutral-600 mt-2">Use "Import New" to add files</p>
            </div>
            <div v-else class="grid grid-cols-4 gap-4">
              <button
                v-for="asset in filteredAssets"
                :key="asset.url"
                @click="selectAsset(asset)"
                class="group relative aspect-video bg-neutral-800 rounded-lg overflow-hidden border-2 transition-colors"
                :class="isAssetSelected(asset) ? 'border-gold-500 ring-2 ring-gold-500/50' : 'border-transparent hover:border-gold-500'"
              >
                <!-- Image Preview -->
                <img
                  v-if="asset.type === 'image'"
                  :src="'local-image://' + asset.path"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <!-- Video Preview -->
                <div v-else-if="asset.type === 'video'" class="w-full h-full">
                  <!-- Thumbnail if available -->
                  <img
                    v-if="asset.thumbnailUrl"
                    :src="getAssetUrl(asset.thumbnailUrl)"
                    class="w-full h-full object-cover"
                  />
                  <!-- Fallback icon -->
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <svg class="w-12 h-12 text-neutral-600 group-hover:text-gold-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <!-- Filename Overlay -->
                <div class="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                  <p class="text-xs text-white truncate">{{ asset.filename }}</p>
                </div>
                <!-- Selection Checkbox (multi-select mode) -->
                <div v-if="multiSelect" class="absolute top-2 right-2">
                  <div
                    class="w-5 h-5 rounded border-2 transition-all flex items-center justify-center"
                    :class="isAssetSelected(asset) ? 'bg-gold-500 border-gold-500' : 'bg-black/50 border-white/50'"
                  >
                    <svg v-if="isAssetSelected(asset)" class="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- Import New Tab -->
        <div v-if="activeTab === 'import'" class="h-full flex flex-col items-center justify-center p-6">
          <button
            @click="browseForFiles"
            class="w-full max-w-2xl px-6 py-12 bg-neutral-800 hover:bg-neutral-700 border-2 border-dashed border-neutral-600 hover:border-gold-500 rounded-lg transition-all"
          >
            <div class="flex flex-col items-center gap-4">
              <svg class="w-20 h-20 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <div class="text-center">
                <p class="text-lg text-neutral-300 font-medium mb-2">Click to select {{ assetTypeLabel }}</p>
                <p class="text-sm text-neutral-500">
                  Files will be imported into your library
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-800 flex-shrink-0">
        <div v-if="multiSelect" class="text-sm text-neutral-400">
          {{ selectedAssets.length }} {{ selectedAssets.length === 1 ? 'item' : 'items' }} selected
        </div>
        <div v-else></div>
        <div class="flex gap-3">
          <button
            @click="handleClose"
            class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            v-if="multiSelect"
            @click="confirmMultiSelect"
            :disabled="selectedAssets.length === 0"
            class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :class="selectedAssets.length > 0 ? 'bg-gold-500 hover:bg-gold-600 text-black' : 'bg-neutral-700 text-neutral-500'"
          >
            Add Selected ({{ selectedAssets.length }})
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <div v-if="showPreviewModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm">
      <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800 flex-shrink-0">
          <div>
            <h2 class="text-lg font-semibold text-gold-500">Preview Assets</h2>
            <p class="text-sm text-neutral-400 mt-1">{{ previewAssets.length }} {{ previewAssets.length === 1 ? 'file' : 'files' }} selected</p>
          </div>
          <button
            @click="cancelPreview"
            class="text-neutral-400 hover:text-white transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Thumbnail Progress -->
        <div v-if="processingThumbnails" class="px-6 py-3 bg-neutral-800/50 border-b border-neutral-800 flex-shrink-0">
          <div class="flex items-center gap-3">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-gold-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <div class="text-sm text-neutral-300 mb-1">Extracting video thumbnails... {{ thumbnailProgress.current }} / {{ thumbnailProgress.total }}</div>
              <div class="h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                <div
                  class="h-full bg-gold-500 transition-all duration-300"
                  :style="{ width: (thumbnailProgress.current / thumbnailProgress.total * 100) + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Grid -->
        <div class="flex-1 overflow-y-auto p-6">
          <div class="grid grid-cols-3 gap-4">
            <div
              v-for="(asset, index) in previewAssets"
              :key="index"
              class="relative aspect-video bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700"
            >
              <!-- Image Preview -->
              <img
                v-if="asset.type === 'image'"
                :src="'file://' + asset.path"
                class="w-full h-full object-cover"
              />

              <!-- Video: Show thumbnail if extracted, otherwise show video -->
              <div v-else-if="asset.type === 'video'" class="w-full h-full relative">
                <!-- Extracted thumbnail -->
                <img
                  v-if="asset.thumbnailDataUrl"
                  :src="asset.thumbnailDataUrl"
                  class="w-full h-full object-cover"
                />
                <!-- Video for extraction (hidden after thumbnail extracted) -->
                <video
                  v-else
                  :id="`preview-video-${index}`"
                  :src="'file://' + asset.path"
                  class="w-full h-full object-cover"
                  preload="metadata"
                  muted
                ></video>
              </div>

              <!-- Filename Overlay -->
              <div class="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1.5">
                <p class="text-xs text-white truncate">{{ asset.filename }}</p>
                <p class="text-[10px] text-neutral-400">{{ asset.type }}</p>
              </div>

              <!-- Processing Indicator -->
              <div v-if="asset.type === 'video' && processingThumbnails && index < thumbnailProgress.current" class="absolute top-2 right-2">
                <div class="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center justify-between gap-3 px-6 py-4 border-t border-neutral-800 flex-shrink-0">
          <div class="text-sm text-neutral-400">
            Review your selections before importing
          </div>
          <div class="flex gap-3">
            <button
              @click="cancelPreview"
              class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              @click="confirmImport"
              :disabled="processingThumbnails || loading"
              class="px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="(processingThumbnails || loading) ? 'bg-neutral-700 text-neutral-500' : 'bg-gold-500 hover:bg-gold-600 text-black'"
            >
              {{ loading ? 'Importing...' : `Import ${previewAssets.length} ${previewAssets.length === 1 ? 'File' : 'Files'}` }}
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
  assetType: {
    type: String,
    default: 'all', // 'image', 'video', or 'all'
    validator: (value) => ['all', 'image', 'video'].includes(value)
  },
  title: {
    type: String,
    default: 'Select Asset'
  },
  libraryRoot: {
    type: String,
    default: null
  },
  multiSelect: {
    type: Boolean,
    default: false
  },
  category: {
    type: String,
    default: 'media', // 'media', 'backgrounds', or 'branding'
    validator: (value) => ['media', 'backgrounds', 'branding'].includes(value)
  }
})

const emit = defineEmits(['close', 'select'])

const activeTab = ref('browse')
const filterType = ref('all')
const loading = ref(false)
const assets = ref([])
const selectedAssets = ref([])

// Preview modal state
const showPreviewModal = ref(false)
const previewAssets = ref([])
const processingThumbnails = ref(false)
const thumbnailProgress = ref({ current: 0, total: 0 })

const assetTypeLabel = computed(() => {
  if (props.assetType === 'image') return 'images'
  if (props.assetType === 'video') return 'videos'
  return 'files'
})

const filteredAssets = computed(() => {
  let filtered = assets.value

  // Filter by dialog type (image/video/all)
  if (props.assetType !== 'all') {
    filtered = filtered.filter(asset => asset.type === props.assetType)
  }

  // Filter by selected filter button
  if (filterType.value !== 'all') {
    filtered = filtered.filter(asset => {
      if (filterType.value === 'images') return asset.type === 'image'
      if (filterType.value === 'videos') return asset.type === 'video'
      return true
    })
  }

  return filtered
})

async function loadLibraryAssets() {
  if (!window.electronAPI || !props.libraryRoot) return

  loading.value = true
  try {
    const result = await window.electronAPI.listLibraryAssets(props.libraryRoot, props.category)
    if (result.success) {
      assets.value = result.assets
    }
  } catch (error) {
    console.error('Failed to load library assets:', error)
  } finally {
    loading.value = false
  }
}

async function browseForFiles() {
  if (!window.electronAPI || !props.libraryRoot) return

  // Step 1: Browse for files (no import yet)
  const browseResult = await window.electronAPI.browseForAssets(props.assetType, props.category)
  if (!browseResult.success || browseResult.canceled || browseResult.files.length === 0) {
    return
  }

  console.log('Selected files for preview:', browseResult.files)

  // Step 2: Show preview modal
  previewAssets.value = browseResult.files
  showPreviewModal.value = true

  // Step 3: Wait for next tick to ensure video elements are rendered
  await nextTick()

  // Step 4: Extract thumbnails from videos
  await extractThumbnailsFromPreviews()
}

async function extractThumbnailsFromPreviews() {
  const videos = previewAssets.value.filter(f => f.type === 'video')
  if (videos.length === 0) return

  processingThumbnails.value = true
  thumbnailProgress.value = { current: 0, total: videos.length }

  for (let i = 0; i < videos.length; i++) {
    // Find the index in previewAssets (not just videos array)
    const assetIndex = previewAssets.value.findIndex(a => a === videos[i])
    const video = videos[i]
    thumbnailProgress.value.current = i + 1

    try {
      // Get the video element for this preview
      const videoElement = document.getElementById(`preview-video-${assetIndex}`)
      if (!videoElement) {
        console.error(`Video element not found for ${video.filename}`)
        continue
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

      console.log(`Extracting thumbnail for ${video.filename}...`)
      const thumbnailDataUrl = await extractVideoThumbnail(videoElement, 10)

      // Store thumbnail data URL in the video object (Vue will react and update the display)
      video.thumbnailDataUrl = thumbnailDataUrl
      console.log(`Thumbnail extracted for ${video.filename}`)
    } catch (error) {
      console.error(`Failed to extract thumbnail for ${video.filename}:`, error)
    }
  }

  processingThumbnails.value = false
}

async function confirmImport() {
  if (!window.electronAPI || !props.libraryRoot) return

  loading.value = true

  try {
    // Step 5: Create plain objects without Vue reactivity wrappers
    const plainAssets = previewAssets.value.map(asset => ({
      filename: asset.filename,
      path: asset.path,
      type: asset.type,
      category: asset.category || props.category, // Include category for proper directory routing
      thumbnailDataUrl: asset.thumbnailDataUrl || null
    }))

    // Import files and save thumbnails
    const result = await window.electronAPI.importAssetsWithThumbnails(
      props.libraryRoot,
      plainAssets
    )

    if (result.success && result.assets.length > 0) {
      console.log('Assets imported:', result.assets)

      // Reload the assets list
      await loadLibraryAssets()

      // Close preview modal
      showPreviewModal.value = false
      previewAssets.value = []

      // Return the imported assets
      if (props.multiSelect) {
        emit('select', result.assets)
      } else {
        emit('select', result.assets[0])
      }
      handleClose()
    }
  } catch (error) {
    console.error('Import failed:', error)
  } finally {
    loading.value = false
  }
}

function cancelPreview() {
  showPreviewModal.value = false
  previewAssets.value = []
  processingThumbnails.value = false
  thumbnailProgress.value = { current: 0, total: 0 }
}

function selectAsset(asset) {
  if (props.multiSelect) {
    // Toggle selection
    const index = selectedAssets.value.findIndex(a => a.url === asset.url)
    if (index >= 0) {
      selectedAssets.value.splice(index, 1)
    } else {
      selectedAssets.value.push(asset)
    }
  } else {
    // Single select - emit immediately
    emit('select', asset)
    handleClose()
  }
}

function isAssetSelected(asset) {
  return selectedAssets.value.some(a => a.url === asset.url)
}

function confirmMultiSelect() {
  if (selectedAssets.value.length > 0) {
    emit('select', selectedAssets.value)
    handleClose()
  }
}

function handleClose() {
  emit('close')
  // Reset state
  activeTab.value = 'browse'
  filterType.value = 'all'
  selectedAssets.value = []
}

function handleImageError(event) {
  event.target.src = '' // Could set a placeholder image here
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

// Load assets when dialog opens
watch(() => props.show, (isShown) => {
  if (isShown) {
    loadLibraryAssets()
  }
})
</script>
