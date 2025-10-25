<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-gold-500">{{ isSelectingEvent ? 'Open Event' : 'Open Library' }}</h2>
        <button
          @click="handleClose"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <!-- Select Library Step -->
        <div v-if="!isSelectingEvent" class="space-y-4">
          <p class="text-sm text-neutral-400">
            Select a .dclib folder to open
          </p>

          <button
            @click="browseForLibrary"
            class="w-full px-6 py-4 bg-neutral-800 hover:bg-neutral-700 border-2 border-dashed border-neutral-600 hover:border-gold-500 rounded-lg transition-all"
          >
            <div class="flex flex-col items-center gap-2">
              <svg class="w-12 h-12 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span class="text-neutral-300 font-medium">Browse for Library Folder</span>
            </div>
          </button>
        </div>

        <!-- Select Event Step -->
        <div v-else class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-neutral-300">
                Library: <span class="text-gold-500">{{ libraryMetadata?.name }}</span>
              </p>
              <p class="text-xs text-neutral-500">
                {{ selectedLibraryPath }}
              </p>
            </div>
            <button
              @click="isSelectingEvent = false"
              class="text-xs text-neutral-400 hover:text-gold-500 transition-colors"
            >
              Change Library
            </button>
          </div>

          <div v-if="events.length === 0" class="py-12 text-center">
            <p class="text-neutral-500">No events in this library yet</p>
            <button
              @click="$emit('new-event')"
              class="mt-4 px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-semibold rounded-lg transition-colors"
            >
              Create First Event
            </button>
          </div>

          <div v-else class="space-y-2 max-h-96 overflow-y-auto">
            <div
              v-for="event in events"
              :key="event"
              class="flex items-center gap-2"
            >
              <button
                @click="handleSelectEvent(event)"
                class="flex-1 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-left transition-colors group"
              >
                <div class="flex items-center justify-between">
                  <span class="text-neutral-200 font-medium">{{ event }}</span>
                  <svg class="w-4 h-4 text-neutral-600 group-hover:text-gold-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              <button
                @click="handleDeleteEvent(event)"
                class="px-3 py-3 bg-neutral-800 hover:bg-red-900 rounded-lg transition-colors group"
                title="Delete this event"
              >
                <svg class="w-4 h-4 text-neutral-500 group-hover:text-red-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div v-if="!isSelectingEvent" class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="handleClose"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'open-library', 'open-event', 'new-event', 'delete-event'])

const isSelectingEvent = ref(false)
const selectedLibraryPath = ref('')
const libraryMetadata = ref(null)
const events = ref([])

async function browseForLibrary() {
  if (!window.electronAPI) return

  const result = await window.electronAPI.selectLibraryFolder()
  if (result.success) {
    const libPath = result.path

    // Load library metadata
    const metadata = await window.electronAPI.loadLibraryMetadata(libPath)
    if (metadata) {
      selectedLibraryPath.value = libPath
      libraryMetadata.value = metadata

      // Load events list
      const eventsList = await window.electronAPI.listLibraryEvents(libPath)
      events.value = eventsList

      // Move to event selection
      isSelectingEvent.value = true

      // Emit library opened
      emit('open-library', libPath, metadata)
    } else {
      alert('Invalid library folder. Please select a .dclib folder with library.json')
    }
  }
}

function handleSelectEvent(eventName) {
  emit('open-event', eventName)
  handleClose()
}

async function handleDeleteEvent(eventName) {
  if (confirm(`Are you sure you want to delete "${eventName}"? This cannot be undone.`)) {
    emit('delete-event', eventName)
    // Reload events list
    const eventsList = await window.electronAPI.listLibraryEvents(selectedLibraryPath.value)
    events.value = eventsList
  }
}

function handleClose() {
  emit('close')
  // Reset state
  isSelectingEvent.value = false
  selectedLibraryPath.value = ''
  libraryMetadata.value = null
  events.value = []
}

// Reset when dialog closes
watch(() => props.show, (isShown) => {
  if (!isShown) {
    isSelectingEvent.value = false
  }
})
</script>
