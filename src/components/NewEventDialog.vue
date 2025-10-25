<template>
  <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
    <div class="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-gold-500">New Event</h2>
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
            class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500"
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

          <div v-if="startFromExisting">
            <select
              v-model="selectedSourceEvent"
              class="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-gold-500"
            >
              <option value="" disabled>Choose an event to copy from...</option>
              <option v-for="event in events" :key="event" :value="event">
                {{ event }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-800">
        <button
          @click="handleClose"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
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
import { ref, watch, nextTick } from 'vue'

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
const events = ref([])
const inputRef = ref(null)

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
}

// Load events and focus input when dialog is shown
watch(() => props.show, async (isShown) => {
  if (isShown) {
    await loadEvents()
    await nextTick()
    inputRef.value?.focus()
  }
})
</script>
