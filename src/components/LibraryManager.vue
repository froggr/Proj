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
            <div class="aspect-video bg-neutral-900 flex items-center justify-center">
              <img
                v-if="asset.type === 'image'"
                :src="'local-image://' + asset.path"
                class="w-full h-full object-cover"
                @error="handleImageError"
              />
              <div v-else-if="asset.type === 'video'" class="w-full h-full flex items-center justify-center">
                <svg class="w-16 h-16 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
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
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

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

function formatFileSize(bytes) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}
</script>
