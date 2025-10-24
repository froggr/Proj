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
  if (params.get('view') === 'projector' || window.location.pathname.includes('/projector')) {
    currentView.value = ProjectorView
  }
})
</script>
