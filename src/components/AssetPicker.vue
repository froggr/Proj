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
                <div v-else-if="asset.type === 'video'" class="w-full h-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-neutral-600 group-hover:text-gold-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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
  }
})

const emit = defineEmits(['close', 'select'])

const activeTab = ref('browse')
const filterType = ref('all')
const loading = ref(false)
const assets = ref([])
const selectedAssets = ref([])

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
    const result = await window.electronAPI.listLibraryAssets(props.libraryRoot)
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

  const result = await window.electronAPI.importAssetsToLibrary(props.libraryRoot, props.assetType)
  if (result.success && result.assets.length > 0) {
    // Reload the assets list to show newly imported files
    await loadLibraryAssets()

    // For single selection, return the first imported asset
    // For multiple selection, you could return all of them
    const asset = result.assets[0]
    emit('select', asset)
    handleClose()
  }
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

// Load assets when dialog opens
watch(() => props.show, (isShown) => {
  if (isShown) {
    loadLibraryAssets()
  }
})
</script>
