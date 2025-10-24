<template>
  <div class="h-screen w-screen bg-gray-900 flex flex-col p-4">
    <!-- Debug info -->
    <div class="mb-2 p-2 bg-blue-900 text-white text-xs rounded">
      DEBUG: Live Index={{ liveIndex }} | Staged={{ stagedIndex }} | Watch={{ watchActive() ? 'ACTIVE' : 'INACTIVE' }}
    </div>

    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-white">Church Presenter</h1>
        <div class="flex gap-2">
          <button
            @click="newPresentation"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            New
          </button>
          <button
            @click="loadPresentation"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Load
          </button>
          <button
            @click="savePresentation"
            class="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-semibold text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
      <button
        @click="toggleProjector"
        class="px-4 py-2 rounded-lg font-semibold transition-all"
        :class="isProjectorOpen ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'"
      >
        {{ isProjectorOpen ? '📺 Projector Open' : 'Open Projector Window' }}
      </button>
    </div>

    <Toolbar
      :can-go-prev="canGoPrev"
      :can-go-next="canGoNext"
      @prev="prevSlide"
      @go-live="goLive"
      @next="nextSlide"
      @clear="clearProjection"
      class="mb-4"
    />

    <div class="flex-1 flex gap-4 min-h-0">
      <!-- Left Panel: Thumbnails -->
      <div class="w-64 bg-gray-800 rounded-lg p-4 overflow-y-auto flex flex-col">
        <h2 class="text-sm font-semibold text-gray-400 mb-3">SLIDES</h2>

        <div class="space-y-2 mb-4">
          <button
            @click="showCanvaDialog = true"
            class="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Canva
          </button>
          <button
            @click="showBibleDialog = true"
            class="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Bible
          </button>
          <button
            @click="showYouTubeDialog = true"
            class="w-full px-3 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            YouTube
          </button>
          <button
            @click="showImageDialog = true"
            class="w-full px-3 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Image
          </button>
          <button
            @click="showVideoDialog = true"
            class="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 rounded-lg text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Local Video
          </button>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto">
          <SlideThumb
            v-for="(slide, index) in slides"
            :key="index"
            :slide="slide"
            :is-staged="index === stagedIndex"
            :is-live="index === liveIndex"
            @click="stageSlide(index)"
          />
        </div>
      </div>

      <!-- Middle Panel: Staged Preview -->
      <div class="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-yellow-400">STAGED PREVIEW</h2>
          <div class="text-xs text-gray-500">
            {{ stagedIndex + 1 }} / {{ slides.length }}
          </div>
        </div>
        <div class="flex-1 border-4 border-yellow-400 rounded-lg overflow-hidden bg-black">
          <SlidePreview :slide="stagedSlide" />
        </div>
      </div>

      <!-- Right Panel: Live Output -->
      <div class="flex-1 bg-gray-800 rounded-lg p-4 flex flex-col">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-sm font-semibold text-green-500">LIVE OUTPUT</h2>
          <div v-if="liveSlide" class="flex items-center gap-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-green-500 font-semibold">ON AIR</span>
          </div>
          <div v-else class="text-xs text-gray-500">Nothing live</div>
        </div>
        <div class="flex-1 border-2 border-green-500 rounded-lg overflow-hidden bg-black">
          <SlidePreview :slide="liveSlide" />
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <AddCanvaSlide
      :show="showCanvaDialog"
      @close="showCanvaDialog = false"
      @add="handleAddSlide"
    />
    <AddBibleSlide
      :show="showBibleDialog"
      @close="showBibleDialog = false"
      @add="handleAddSlide"
    />
    <AddYouTubeSlide
      :show="showYouTubeDialog"
      @close="showYouTubeDialog = false"
      @add="handleAddSlide"
    />
    <AddImageSlide
      :show="showImageDialog"
      @close="showImageDialog = false"
      @add="handleAddSlide"
    />
    <AddLocalVideoSlide
      :show="showVideoDialog"
      @close="showVideoDialog = false"
      @add="handleAddSlide"
    />

    <!-- Monitor Selection Dialog -->
    <Modal :show="showMonitorDialog" title="Select Projector Display" @close="showMonitorDialog = false">
      <div class="space-y-4">
        <p class="text-sm text-gray-300">
          Choose which display to use for the projector output:
        </p>

        <div class="space-y-2">
          <div
            v-for="(monitor, index) in availableMonitors"
            :key="index"
            class="flex items-center p-3 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors"
            :class="{ 'ring-2 ring-blue-500': selectedMonitor === index }"
            @click="selectedMonitor = index"
          >
            <input
              type="radio"
              :value="index"
              v-model="selectedMonitor"
              class="mr-3"
            />
            <span class="text-white">{{ monitor }}</span>
          </div>
        </div>

        <div class="flex gap-3 justify-end pt-4">
          <button
            @click="showMonitorDialog = false"
            class="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
          >
            Cancel
          </button>
          <button
            @click="openProjectorOnMonitor"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold text-white transition-colors"
          >
            Open Projector
          </button>
        </div>
      </div>
    </Modal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePresentation } from '../composables/usePresentation'
import { useKeyboard } from '../composables/useKeyboard'
import { useProjector } from '../composables/useProjector'
import SlideThumb from '../components/SlideThumb.vue'
import SlidePreview from '../components/SlidePreview.vue'
import Toolbar from '../components/Toolbar.vue'
import Modal from '../components/Modal.vue'
import AddCanvaSlide from '../components/AddCanvaSlide.vue'
import AddBibleSlide from '../components/AddBibleSlide.vue'
import AddYouTubeSlide from '../components/AddYouTubeSlide.vue'
import AddImageSlide from '../components/AddImageSlide.vue'
import AddLocalVideoSlide from '../components/AddLocalVideoSlide.vue'

const {
  slides,
  stagedSlide,
  liveSlide,
  stagedIndex,
  liveIndex,
  canGoPrev,
  canGoNext,
  goLive,
  nextSlide,
  prevSlide,
  clearProjection,
  stageSlide,
  addSlide,
  savePresentation: savePresentationData,
  loadPresentation: loadPresentationData,
  watchActive
} = usePresentation()

const {
  isProjectorOpen,
  getAvailableMonitors,
  openProjector,
  closeProjector
} = useProjector()

const showCanvaDialog = ref(false)
const showBibleDialog = ref(false)
const showYouTubeDialog = ref(false)
const showImageDialog = ref(false)
const showVideoDialog = ref(false)
const showMonitorDialog = ref(false)
const availableMonitors = ref([])
const selectedMonitor = ref(0)

async function toggleProjector() {
  if (isProjectorOpen.value) {
    closeProjector()
  } else {
    // Show monitor selection dialog
    availableMonitors.value = await getAvailableMonitors()
    if (availableMonitors.value.length > 1) {
      showMonitorDialog.value = true
    } else {
      // Only one monitor, open directly
      openProjector(0)
    }
  }
}

async function openProjectorOnMonitor() {
  showMonitorDialog.value = false
  await openProjector(selectedMonitor.value)
}

function handleAddSlide(slide) {
  addSlide(slide)
  // Close all dialogs
  showCanvaDialog.value = false
  showBibleDialog.value = false
  showYouTubeDialog.value = false
  showImageDialog.value = false
  showVideoDialog.value = false
}

async function newPresentation() {
  if (confirm('Create a new presentation? This will clear all current slides.')) {
    slides.value = []
    stagedIndex.value = 0
    liveIndex.value = null
  }
}

async function savePresentation() {
  try {
    const { save } = await import('@tauri-apps/plugin-dialog')
    const { writeTextFile } = await import('@tauri-apps/plugin-fs')

    const filePath = await save({
      defaultPath: 'presentation.json',
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }]
    })

    if (filePath) {
      const data = savePresentationData()
      await writeTextFile(filePath, data)
      alert('Presentation saved successfully!')
    }
  } catch (error) {
    console.error('Failed to save presentation:', error)
    alert('Failed to save presentation: ' + error.message)
  }
}

async function loadPresentation() {
  try {
    const { open } = await import('@tauri-apps/plugin-dialog')
    const { readTextFile } = await import('@tauri-apps/plugin-fs')

    const filePath = await open({
      multiple: false,
      filters: [{
        name: 'JSON',
        extensions: ['json']
      }]
    })

    if (filePath) {
      const data = await readTextFile(filePath)
      loadPresentationData(data)
      alert('Presentation loaded successfully!')
    }
  } catch (error) {
    console.error('Failed to load presentation:', error)
    alert('Failed to load presentation: ' + error.message)
  }
}

useKeyboard({
  onSpace: goLive,
  onArrowLeft: prevSlide,
  onArrowRight: nextSlide,
  onEscape: clearProjection
})
</script>
