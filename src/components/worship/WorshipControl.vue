<template>
  <div class="flex h-full bg-neutral-900">
    <!-- Left Panel: Setlist -->
    <div class="w-80 border-r border-neutral-800 flex flex-col">
      <div class="p-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-gold-500">Setlist</h2>
      </div>

      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(song, index) in setlist"
          :key="song.id"
          @click="goToSong(index)"
          class="p-4 border-b border-neutral-800 cursor-pointer transition-colors"
          :class="{
            'bg-gold-500/20 border-l-4 border-l-gold-500': song.isCurrent,
            'hover:bg-neutral-800': !song.isCurrent
          }"
        >
          <div class="font-medium text-white">{{ song.title }}</div>
          <div v-if="song.artist" class="text-sm text-neutral-400 mt-1">
            {{ song.artist }}
          </div>
        </div>

        <div v-if="setlist.length === 0" class="p-8 text-center text-neutral-500">
          No songs in setlist
        </div>
      </div>
    </div>

    <!-- Middle Panel: Section Selector -->
    <div class="flex-1 flex flex-col">
      <div class="p-4 border-b border-neutral-800 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-white">
            {{ currentSong?.title || 'No Song Selected' }}
          </h2>
          <div v-if="currentSong?.artist" class="text-sm text-neutral-400 mt-1">
            {{ currentSong.artist }}
          </div>
        </div>

        <!-- Song Navigation -->
        <div class="flex gap-2">
          <button
            @click="prevSong"
            :disabled="!canGoPrevSong"
            class="px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="canGoPrevSong ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-600'"
            title="Previous Song (Page Up)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            @click="nextSong"
            :disabled="!canGoNextSong"
            class="px-3 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="canGoNextSong ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-600'"
            title="Next Song (Page Down)"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-y-auto p-6">
        <div v-if="currentSong?.sections" class="space-y-4">
          <div
            v-for="(section, index) in currentSong.sections"
            :key="index"
            @click="stageSection(index)"
            class="p-6 rounded-lg border-2 cursor-pointer transition-all"
            :class="{
              'border-yellow-400 bg-yellow-400/10': index === stagedSectionIndex,
              'border-green-500 bg-green-500/10': index === liveSectionIndex,
              'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600': index !== stagedSectionIndex && index !== liveSectionIndex
            }"
          >
            <!-- Section Title -->
            <div class="flex items-center justify-between mb-3">
              <div class="font-semibold text-white">{{ section.title }}</div>
              <div class="flex items-center gap-2">
                <span
                  v-if="index === liveSectionIndex"
                  class="px-2 py-1 rounded text-xs font-medium bg-green-500 text-black"
                >
                  LIVE
                </span>
                <span
                  v-if="index === stagedSectionIndex"
                  class="px-2 py-1 rounded text-xs font-medium bg-yellow-400 text-black"
                >
                  STAGED
                </span>
              </div>
            </div>

            <!-- Lyrics Preview (no chords) -->
            <div class="space-y-2 text-neutral-300 text-sm">
              <div
                v-for="(line, lineIndex) in section.lines.slice(0, 3)"
                :key="lineIndex"
                class="flex flex-wrap gap-1"
              >
                <span v-for="(pair, pairIndex) in line" :key="pairIndex">
                  {{ pair[1] }}
                </span>
              </div>
              <div v-if="section.lines.length > 3" class="text-neutral-500 italic">
                ...
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-full text-neutral-500">
          Select a song from the setlist
        </div>
      </div>

      <!-- Control Toolbar -->
      <div class="p-4 border-t border-neutral-800 flex items-center justify-between">
        <div class="flex gap-3">
          <button
            @click="prevSection"
            :disabled="!canGoPrevSection"
            class="px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="canGoPrevSection ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-600'"
            title="Previous Section (←)"
          >
            ← Prev
          </button>
          <button
            @click="nextSection"
            :disabled="!canGoNextSection"
            class="px-4 py-2 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            :class="canGoNextSection ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-800 text-neutral-600'"
            title="Next Section (→)"
          >
            Next →
          </button>
        </div>

        <div class="flex gap-3">
          <button
            @click="clearProjection"
            class="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white transition-colors"
            title="Clear (Esc)"
          >
            Clear
          </button>
          <button
            @click="goLive"
            class="px-6 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-black font-semibold transition-colors"
            title="Go Live (Space)"
          >
            GO LIVE
          </button>
        </div>
      </div>
    </div>

    <!-- Right Panel: Live Preview -->
    <div class="w-96 border-l border-neutral-800 flex flex-col">
      <div class="p-4 border-b border-neutral-800">
        <h2 class="text-lg font-semibold text-green-500">Live Output</h2>
      </div>

      <div class="flex-1 bg-black flex items-center justify-center">
        <WorshipProjector
          :section="liveSection"
          :background-video="currentBackgroundVideo"
          :next-background-video="nextBackgroundVideo"
          :text-scale="textScale"
          :library-root="libraryRoot"
          :show-section-title="false"
          :video-opacity="0.5"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useWorship } from '@/composables/useWorship'
import WorshipProjector from './WorshipProjector.vue'

const props = defineProps({
  textScale: {
    type: Number,
    default: 100
  },
  libraryRoot: {
    type: String,
    default: null
  }
})

const {
  setlist,
  currentSong,
  stagedSectionIndex,
  liveSectionIndex,
  stagedSection,
  liveSection,
  currentBackgroundVideo,
  nextBackgroundVideo,
  canGoPrevSection,
  canGoNextSection,
  canGoPrevSong,
  canGoNextSong,
  goToSong,
  nextSong,
  prevSong,
  stageSection,
  nextSection,
  prevSection,
  goLive,
  clearProjection
} = useWorship()
</script>
