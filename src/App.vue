<template>
  <component :is="currentView" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import ControlView from './views/ControlView.vue'
import ProjectorView from './views/ProjectorView.vue'

const currentView = ref(ControlView)

onMounted(() => {
  const params = new URLSearchParams(window.location.search)
  if (
    params.get('view') === 'projector' ||
    window.location.pathname.includes('/projector') ||
    window.location.hash.includes('projector')
  ) {
    currentView.value = ProjectorView
  }

  // Listen for main process logs
  if (window.electronAPI?.onMainProcessLog) {
    window.electronAPI.onMainProcessLog((message) => {
      // Logs will automatically appear in console via preload
    })
  }
})
</script>
