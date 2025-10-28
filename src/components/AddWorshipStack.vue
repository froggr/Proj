<template>
  <Modal :show="show" @close="handleClose" title="Add Worship Stack">
    <div class="space-y-4">
      <!-- Stack Title -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Stack Title</label>
        <input
          v-model="stackTitle"
          type="text"
          placeholder="e.g., Sunday Morning Worship"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500"
        />
      </div>

      <!-- Song Selection -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Select Songs ({{ selectedSongs.length }})
        </label>

        <!-- Search -->
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search songs..."
          class="w-full px-3 py-2 mb-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:border-gold-500"
        />

        <!-- Song List -->
        <div class="max-h-64 overflow-y-auto bg-neutral-900 rounded-lg border border-neutral-700">
          <div v-if="filteredSongs.length === 0" class="p-4 text-center text-neutral-500 text-sm">
            No songs in library. Import songs first.
          </div>
          <div
            v-for="song in filteredSongs"
            :key="song.id"
            @click="toggleSong(song.id)"
            class="p-3 border-b border-neutral-800 cursor-pointer hover:bg-neutral-800 transition-colors"
            :class="{ 'bg-gold-500/10 border-l-4 border-l-gold-500': selectedSongs.includes(song.id) }"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <div class="font-medium text-white">{{ song.title }}</div>
                <div v-if="song.artist" class="text-xs text-neutral-400 mt-1">{{ song.artist }}</div>
              </div>
              <div v-if="selectedSongs.includes(song.id)" class="text-gold-500 text-sm font-medium">
                #{{ selectedSongs.indexOf(song.id) + 1 }}
              </div>
            </div>
          </div>
        </div>

        <div class="text-xs text-neutral-500 mt-2">
          Click songs to add them to the setlist. Songs will appear in order selected.
        </div>
      </div>

      <!-- Background Mode -->
      <div>
        <label class="block text-sm font-medium text-neutral-300 mb-2">Background Videos</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="backgroundMode"
              type="radio"
              value="per-song"
              class="text-gold-500 focus:ring-gold-500"
            />
            <span class="text-sm text-neutral-300">Per Song (assign backgrounds to each song)</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              v-model="backgroundMode"
              type="radio"
              value="auto-rotate"
              class="text-gold-500 focus:ring-gold-500"
            />
            <span class="text-sm text-neutral-300">Auto-rotate (cycle through videos automatically)</span>
          </label>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 justify-end pt-4">
        <button
          @click="handleClose"
          class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleAdd"
          :disabled="selectedSongs.length === 0 || !stackTitle.trim()"
          class="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Worship Stack
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import Modal from './Modal.vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  songs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add'])

const stackTitle = ref('Worship')
const selectedSongs = ref([])
const backgroundMode = ref('auto-rotate')
const searchQuery = ref('')

const filteredSongs = computed(() => {
  if (!searchQuery.value) return props.songs

  const query = searchQuery.value.toLowerCase()
  return props.songs.filter(song =>
    song.title?.toLowerCase().includes(query) ||
    song.artist?.toLowerCase().includes(query)
  )
})

function toggleSong(songId) {
  const index = selectedSongs.value.indexOf(songId)
  if (index > -1) {
    selectedSongs.value.splice(index, 1)
  } else {
    selectedSongs.value.push(songId)
  }
}

function handleAdd() {
  emit('add', {
    title: stackTitle.value.trim(),
    setlist: [...selectedSongs.value],
    backgroundMode: backgroundMode.value,
    backgroundVideos: [] // Will be populated when user assigns videos
  })
  handleClose()
}

function handleClose() {
  emit('close')
  // Reset form after a short delay to avoid flicker
  setTimeout(() => {
    stackTitle.value = 'Worship'
    selectedSongs.value = []
    backgroundMode.value = 'auto-rotate'
    searchQuery.value = ''
  }, 300)
}

// Reset selected songs when dialog opens
watch(() => props.show, (isShowing) => {
  if (isShowing) {
    selectedSongs.value = []
    searchQuery.value = ''
  }
})
</script>
