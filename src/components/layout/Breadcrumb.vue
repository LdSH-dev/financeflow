<template>
  <nav class="flex" aria-label="Breadcrumb">
    <ol class="inline-flex items-center space-x-1 md:space-x-3">
      <li v-for="(item, index) in breadcrumbItems" :key="index" class="inline-flex items-center">
        <div v-if="index > 0" class="flex items-center">
          <ChevronRightIcon class="w-4 h-4 text-gray-400 mx-1" />
        </div>
        
        <router-link
          v-if="index < breadcrumbItems.length - 1"
          :to="getItemPath(index)"
          class="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          {{ item }}
        </router-link>
        
        <span 
          v-else
          class="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          {{ item }}
        </span>
      </li>
    </ol>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRightIcon } from '@heroicons/vue/24/solid'
import { useUIStore } from '@stores/ui'

const uiStore = useUIStore()

const breadcrumbItems = computed(() => uiStore.breadcrumb)

const getItemPath = (index: number): string => {
  // Simple breadcrumb path generation
  const items = breadcrumbItems.value.slice(0, index + 1)
  
  if (items.length === 1 && items[0] === 'Dashboard') {
    return '/dashboard'
  }
  
  // Convert breadcrumb items to path
  return '/' + items.slice(1).map(item => item.toLowerCase()).join('/')
}
</script>