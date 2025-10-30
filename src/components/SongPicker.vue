<template>
  <Modal :show="show" title="Add Song" @close="$emit('close')">
    <div class="space-y-4">
      <!-- Song Library -->
      <div>
        <div class="flex items-center justify-between mb-3">
          <label class="text-sm font-medium text-neutral-300">Select Song</label>
          <button
            @click="handleImportSongs"
            class="text-xs px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-neutral-300"
          >
            📁 Import Songs
          </button>
        </div>

        <!-- Song List -->
        <div v-if="songs.length > 0" class="max-h-64 overflow-y-auto space-y-2 bg-neutral-900/50 rounded-lg p-2">
          <button
            v-for="song in songs"
            :key="song.id"
            @click="selectedSong = song"
            class="w-full text-left px-3 py-2 rounded-lg transition-all"
            :class="{
              'bg-gold-500 text-black': selectedSong?.id === song.id,
              'bg-neutral-800 hover:bg-neutral-700 text-neutral-200': selectedSong?.id !== song.id
            }"
          >
            <div class="font-medium text-sm">{{ song.title }}</div>
            <div class="text-xs opacity-70">{{ song.artist }}</div>
          </button>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-8 text-neutral-500 bg-neutral-900/50 rounded-lg">
          <div class="text-4xl mb-2">🎵</div>
          <p class="text-sm">No songs in library</p>
          <p class="text-xs mt-1">Import OnSong or ChordPro files</p>
        </div>
      </div>

      <!-- Background Settings -->
      <div v-if="selectedSong">
        <label class="block text-sm font-medium text-neutral-300 mb-2">Background</label>
        <div class="space-y-2">
          <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
            <input
              type="radio"
              v-model="backgroundMode"
              value="none"
              class="text-gold-500"
            />
            <span class="text-sm text-neutral-200">None (Black)</span>
          </label>
          <label class="flex items-center gap-2 p-2 bg-neutral-800/50 rounded-lg cursor-pointer hover:bg-neutral-800">
            <input
              type="radio"
              v-model="backgroundMode"
              value="single"
              class="text-gold-500"
            />
            <span class="text-sm text-neutral-200">Single Video</span>
          </label>
        </div>

        <!-- Video Picker (if single mode) -->
        <div v-if="backgroundMode === 'single'" class="mt-2">
          <button
            @click="selectBackgroundVideo"
            class="w-full px-3 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors text-sm text-neutral-200"
          >
            {{ backgroundVideo ? '✓ Video Selected' : 'Choose Video' }}
          </button>
        </div>
      </div>

      <!-- Lines Per Section -->
      <div v-if="selectedSong">
        <label class="block text-sm font-medium text-neutral-300 mb-2">
          Lines Per Section
          <span class="text-xs text-neutral-500 ml-1">(splits long sections)</span>
        </label>
        <input
          type="number"
          v-model.number="linesPerSection"
          min="2"
          max="12"
          class="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-neutral-200 text-sm focus:outline-none focus:border-gold-500"
        />
      </div>

      <!-- Actions -->
      <div class="flex gap-2 pt-2">
        <button
          @click="$emit('close')"
          class="flex-1 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg transition-colors text-sm font-medium"
        >
          Cancel
        </button>
        <button
          @click="handleAdd"
          :disabled="!selectedSong"
          class="flex-1 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-black rounded-lg transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Song
        </button>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from './Modal.vue'
import { useSongLibrary } from '@/library/SongLibrary'

const props = defineProps({
  show: Boolean,
  songs: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'add', 'import-songs', 'select-video'])

const { browseSongFiles, importSongFiles } = useSongLibrary()

const selectedSong = ref(null)
const backgroundMode = ref('none')
const backgroundVideo = ref(null)
const linesPerSection = ref(4)

async function handleImportSongs() {
  try {
    const result = await browseSongFiles()
    if (result.canceled || !result.files || result.files.length === 0) {
      return
    }

    await importSongFiles(result.files)
    emit('import-songs') // Tell parent to reload songs
  } catch (error) {
    console.error('Import error:', error)
  }
}

function selectBackgroundVideo() {
  emit('select-video', (videoUrl) => {
    backgroundVideo.value = videoUrl
  })
}

function handleAdd() {
  if (!selectedSong.value) return

  emit('add', {
    type: 'song',
    songId: selectedSong.value.id,
    title: selectedSong.value.title,
    backgroundMode: backgroundMode.value,
    backgroundVideo: backgroundVideo.value,
    linesPerSection: linesPerSection.value
  })

  // Reset
  selectedSong.value = null
  backgroundMode.value = 'none'
  backgroundVideo.value = null
  linesPerSection.value = 4
}
</script>
