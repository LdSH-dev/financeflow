<template>
  <router-link
    :to="item.href"
    :class="[
      'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200',
      isActive 
        ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-200' 
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
      collapsed ? 'justify-center' : ''
    ]"
  >
    <component 
      :is="item.icon" 
      :class="[
        'flex-shrink-0 w-5 h-5',
        isActive 
          ? 'text-primary-600 dark:text-primary-400' 
          : 'text-gray-400 group-hover:text-gray-500',
        collapsed ? '' : 'mr-3'
      ]" 
    />
    
    <span v-if="!collapsed" class="truncate">
      {{ item.name }}
    </span>

    <!-- Tooltip for collapsed state -->
    <div 
      v-if="collapsed"
      class="tooltip left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {{ item.name }}
    </div>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

interface NavigationItem {
  name: string
  href: string
  icon: any
  current: boolean
}

interface Props {
  item: NavigationItem
  collapsed?: boolean
}

const props = defineProps<Props>()
const route = useRoute()

const isActive = computed(() => {
  return route.path === props.item.href || route.path.startsWith(props.item.href + '/')
})
</script>

<style scoped>
.tooltip {
  @apply absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm pointer-events-none whitespace-nowrap;
}

.tooltip::after {
  content: '';
  @apply absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-1/2 -translate-y-1/2;
}
</style>