<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-gold-500">Select Event</h2>
        <button
          @click="$emit('close')"
          class="text-neutral-400 hover:text-white transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="p-6">
        <div v-if="events.length === 0" class="py-12 text-center">
          <p class="text-neutral-500">No events in this library yet</p>
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

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="$emit('close')"
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
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['close', 'select-event', 'delete-event'])

const events = ref([])

async function loadEvents() {
  if (!props.libraryRoot || !window.electronAPI) {
    events.value = []
    return
  }

  const eventsList = await window.electronAPI.listLibraryEvents(props.libraryRoot)
  events.value = eventsList || []
}

function handleSelectEvent(eventName) {
  emit('select-event', eventName)
  emit('close')
}

function handleDeleteEvent(eventName) {
  if (confirm(`Are you sure you want to delete "${eventName}"? This cannot be undone.`)) {
    emit('delete-event', eventName)
    // Reload events list
    loadEvents()
  }
}

// Load events when dialog is shown
watch(() => props.show, (isShown) => {
  if (isShown) {
    loadEvents()
  }
})
</script>
