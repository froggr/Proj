<template>
  <!-- Just the middle section grid - left panel (songs) is handled by ControlView -->
  <!-- Section Grid (replaces slide thumbnails in normal mode) -->
  <div class="flex-1 bg-neutral-900/50 backdrop-blur rounded-xl border border-neutral-800 flex flex-col overflow-hidden">
      <!-- Section Grid (buttons now in ControlView for consistent positioning) -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="currentSong?.processed_sections" class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <div
            v-for="(section, index) in currentSong.processed_sections"
            :key="`${currentSong._renderKey || 0}-${index}`"
            @click="stageSection(index)"
            class="bg-neutral-800/30 rounded-lg border-2 cursor-pointer transition-all hover:border-neutral-600 overflow-hidden"
            :class="{
              'border-yellow-400 shadow-lg shadow-yellow-400/20': index === stagedSectionIndex,
              'border-green-500 shadow-lg shadow-green-500/20': index === liveSectionIndex,
              'border-neutral-700/50': index !== stagedSectionIndex && index !== liveSectionIndex
            }"
          >
            <!-- Section Title with color coding -->
            <div
              class="px-3 py-2 font-semibold text-sm border-b"
              :class="{
                'bg-emerald-900/30 border-emerald-800/50 text-emerald-400': section.title.toLowerCase().includes('verse'),
                'bg-red-900/30 border-red-800/50 text-red-400': section.title.toLowerCase().includes('chorus'),
                'bg-purple-900/30 border-purple-800/50 text-purple-400': section.title.toLowerCase().includes('bridge'),
                'bg-cyan-900/30 border-cyan-800/50 text-cyan-400': section.title.toLowerCase().includes('intro') || section.title.toLowerCase().includes('outro'),
                'bg-orange-900/30 border-orange-800/50 text-orange-400': section.title.toLowerCase().includes('instrumental'),
                'bg-neutral-800/50 border-neutral-700/50 text-neutral-400': !section.title.toLowerCase().match(/verse|chorus|bridge|intro|outro|instrumental/)
              }"
            >
              {{ section.title }}
            </div>

            <!-- Lyrics Preview (no chords) -->
            <div class="p-3 text-xs text-neutral-300 leading-relaxed space-y-1 max-h-32 overflow-hidden">
              <div v-for="(line, lineIndex) in section.lines" :key="lineIndex" class="whitespace-pre-wrap">
                <span v-for="(pair, pairIndex) in line" :key="pairIndex">{{ pair[1] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex items-center justify-center h-full text-center text-neutral-500">
          <div>
            <svg class="w-16 h-16 text-neutral-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <h3 class="text-sm font-semibold text-neutral-500 mb-2">No Song Selected</h3>
            <p class="text-xs text-neutral-600">Select a song from the worship stack</p>
          </div>
        </div>
      </div>
    </div>
</template>

<script setup>
import { watch } from 'vue'
import { useWorship } from '@/composables/useWorship'

defineEmits(['clear', 'go-live'])

const {
  currentSong,
  stagedSection,
  liveSection,
  stagedSectionIndex,
  liveSectionIndex,
  canGoPrevSection,
  canGoNextSection,
  stageSection,
  nextSection,
  prevSection,
  goLive
} = useWorship()

// Debug: Log current song data
watch(currentSong, (newSong) => {
  console.log('WorshipControl - currentSong changed:', newSong)
  console.log('WorshipControl - processed_sections:', newSong?.processed_sections)
  console.log('WorshipControl - processed_sections length:', newSong?.processed_sections?.length)
}, { immediate: true, deep: true })

watch(stagedSectionIndex, (newIndex) => {
  console.log('WorshipControl - stagedSectionIndex:', newIndex)
}, { immediate: true })

watch(liveSectionIndex, (newIndex) => {
  console.log('WorshipControl - liveSectionIndex:', newIndex)
}, { immediate: true })
</script>
