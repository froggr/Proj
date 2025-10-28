<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-gold-500/20 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Logo & Branding -->
      <div class="flex flex-col items-center pt-8 pb-4 px-6">
        <Logo className="w-16 h-16 mb-3" />
        <h1 class="text-2xl font-bold text-gold-500 mb-1">Select Event</h1>
        <p class="text-xs text-neutral-500 uppercase tracking-wider">Dongle Control Projector</p>
      </div>

      <!-- Close Button (top right) -->
      <button
        @click="$emit('close')"
        class="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Search Bar -->
      <div v-if="events.length > 0" class="px-6 pb-4">
        <div class="relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search events..."
            class="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
          />
          <svg class="absolute left-3 top-2.5 w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <p v-if="filteredEvents.length !== events.length" class="text-xs text-neutral-500 mt-2">
          Showing {{ filteredEvents.length }} of {{ events.length }} events
        </p>
      </div>

      <!-- Content -->
      <div class="px-6 pb-6">
        <div v-if="events.length === 0" class="py-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-neutral-400 font-medium mb-1">No events yet</p>
          <p class="text-sm text-neutral-600">Create your first event to get started</p>
        </div>

        <div v-else-if="filteredEvents.length === 0" class="py-12 text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="text-neutral-400 font-medium mb-1">No results found</p>
          <p class="text-sm text-neutral-600">Try a different search term</p>
        </div>

        <div v-else class="space-y-2 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
          <div
            v-for="event in filteredEvents"
            :key="event"
            class="flex items-center gap-2"
          >
            <button
              @click="handleSelectEvent(event)"
              class="flex-1 px-4 py-3 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700 hover:border-gold-500/50 rounded-lg text-left transition-all group"
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
              class="px-3 py-3 bg-neutral-800/50 hover:bg-red-900/50 border border-neutral-700 hover:border-red-500 rounded-lg transition-all group"
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
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Logo from './Logo.vue'

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
const searchQuery = ref('')

// Filter events based on search query
const filteredEvents = computed(() => {
  if (!searchQuery.value.trim()) {
    return events.value
  }

  const query = searchQuery.value.toLowerCase()
  return events.value.filter(event =>
    event.toLowerCase().includes(query)
  )
})

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

// Load events and reset search when dialog is shown
watch(() => props.show, (isShown) => {
  if (isShown) {
    loadEvents()
    searchQuery.value = ''
  }
})
</script>

<style scoped>
/* Custom scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #404040;
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #525252;
}
</style>
