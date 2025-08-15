<template>
  <div :class="collapsed ? 'flex justify-center' : 'flex items-center'">
    <!-- User Avatar -->
    <div class="flex-shrink-0">
      <img 
        v-if="authStore.user?.avatarUrl"
        :src="authStore.user.avatarUrl" 
        :alt="authStore.userFullName"
        class="w-8 h-8 rounded-full"
      />
      <div 
        v-else
        class="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center"
      >
        <span class="text-white text-sm font-medium">
          {{ authStore.userInitials }}
        </span>
      </div>
    </div>

    <!-- User Info (expanded) -->
    <div v-if="!collapsed" class="ml-3 flex-1 min-w-0">
      <p class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
        {{ authStore.userFullName }}
      </p>
      <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
        {{ authStore.user?.email }}
      </p>
    </div>

    <!-- Menu Dropdown -->
    <div class="relative" :class="collapsed ? 'ml-0' : 'ml-3'">
      <button
        @click="showMenu = !showMenu"
        class="p-1 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        <EllipsisVerticalIcon class="w-5 h-5" />
      </button>

      <!-- Dropdown Menu -->
      <transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div 
          v-if="showMenu"
          class="absolute bottom-full mb-2 right-0 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1"
        >
          <button
            @click="handleLogout"
            class="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4 inline mr-2" />
            Sign out
          </button>
        </div>
      </transition>
    </div>

    <!-- Tooltip for collapsed state -->
    <div 
      v-if="collapsed"
      class="tooltip left-full ml-2 opacity-0 hover:opacity-100 transition-opacity"
    >
      {{ authStore.userFullName }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EllipsisVerticalIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import { useConfirmation } from '@composables/useConfirmation'

interface Props {
  collapsed?: boolean
}

defineProps<Props>()

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { confirmAction } = useConfirmation()

const showMenu = ref(false)

const handleLogout = async () => {
  showMenu.value = false
  
  const confirmed = await confirmAction(
    'Sign Out',
    'Are you sure you want to sign out?',
    async () => {
      await authStore.logout()
      await router.push('/login')
    }
  )
}

// Close menu when clicking outside
import { onClickOutside } from '@vueuse/core'
const menuRef = ref()
onClickOutside(menuRef, () => {
  showMenu.value = false
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