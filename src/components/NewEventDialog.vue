<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-gold-500/20 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Logo & Branding -->
      <div class="flex flex-col items-center pt-8 pb-4 px-6">
        <Logo className="w-16 h-16 mb-3" />
        <h1 class="text-2xl font-bold text-gold-500 mb-1">New Event</h1>
        <p class="text-xs text-neutral-500 uppercase tracking-wider">Dongle Control Projector</p>
      </div>

      <!-- Close Button (top right) -->
      <button
        @click="handleClose"
        class="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Content -->
      <div class="p-6 space-y-4">
        <!-- Event Name -->
        <div>
          <label class="block text-sm font-medium text-neutral-300 mb-2">
            Event Name
          </label>
          <input
            ref="inputRef"
            v-model="eventName"
            type="text"
            placeholder="Sunday Service"
            class="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
            @keyup.enter="handleCreate"
          />
        </div>

        <!-- Start from existing -->
        <div v-if="events.length > 0" class="space-y-3">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="startFromExisting"
              type="checkbox"
              class="w-4 h-4 bg-neutral-800 border-neutral-600 rounded text-gold-500 focus:ring-gold-500 focus:ring-offset-0"
            />
            <span class="text-sm text-neutral-300">Start from existing event</span>
          </label>

          <div v-if="startFromExisting" class="space-y-2">
            <!-- Search Bar -->
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search events to copy from..."
                class="w-full pl-10 pr-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all"
              />
              <svg class="absolute left-3 top-2.5 w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <!-- Results counter -->
            <p v-if="filteredEvents.length !== events.length" class="text-xs text-neutral-500">
              Showing {{ filteredEvents.length }} of {{ events.length }} events
            </p>

            <!-- Event List -->
            <div class="max-h-48 overflow-y-auto pr-2 space-y-1 custom-scrollbar">
              <div v-if="filteredEvents.length === 0" class="py-8 text-center">
                <p class="text-sm text-neutral-500">No events found</p>
              </div>
              <button
                v-for="event in filteredEvents"
                :key="event"
                @click="selectedSourceEvent = event"
                class="w-full px-3 py-2 rounded-lg text-left transition-all"
                :class="selectedSourceEvent === event
                  ? 'bg-gold-500/20 border border-gold-500 text-gold-400'
                  : 'bg-neutral-800/50 border border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:border-gold-500/50'"
              >
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium">{{ event }}</span>
                  <svg v-if="selectedSourceEvent === event" class="w-4 h-4 text-gold-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="handleClose"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleCreate"
          :disabled="!eventName.trim()"
          class="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:bg-neutral-700 disabled:cursor-not-allowed text-black font-semibold rounded-lg transition-colors"
        >
          Create Event
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
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

const emit = defineEmits(['close', 'create'])

const eventName = ref('Sunday Service')
const startFromExisting = ref(false)
const selectedSourceEvent = ref('')
const searchQuery = ref('')
const events = ref([])
const inputRef = ref(null)

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

function handleCreate() {
  if (!eventName.value.trim()) return

  const data = {
    name: eventName.value.trim(),
    copyFrom: startFromExisting.value ? selectedSourceEvent.value : null
  }

  emit('create', data)
  handleClose()
}

function handleClose() {
  emit('close')
  // Reset
  eventName.value = 'Sunday Service'
  startFromExisting.value = false
  selectedSourceEvent.value = ''
  searchQuery.value = ''
}

// Load events and focus input when dialog is shown
watch(() => props.show, async (isShown) => {
  if (isShown) {
    await loadEvents()
    await nextTick()
    inputRef.value?.focus()
  }
})

// Reset search when checkbox is unchecked
watch(() => startFromExisting.value, (isChecked) => {
  if (!isChecked) {
    searchQuery.value = ''
    selectedSourceEvent.value = ''
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
