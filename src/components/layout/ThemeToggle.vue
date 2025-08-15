<template>
  <button
    @click="toggleTheme"
    class="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
    :title="currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
  >
    <SunIcon v-if="currentTheme === 'dark'" class="w-6 h-6" />
    <MoonIcon v-else class="w-6 h-6" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SunIcon, MoonIcon } from '@heroicons/vue/24/outline'
import { useUIStore } from '@stores/ui'

const uiStore = useUIStore()

const currentTheme = computed(() => {
  if (uiStore.theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return uiStore.theme
})

const toggleTheme = () => {
  const newTheme = currentTheme.value === 'dark' ? 'light' : 'dark'
  uiStore.setTheme(newTheme)
}
</script>