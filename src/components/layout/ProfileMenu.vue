<template>
  <div class="relative">
    <button
      @click="showMenu = !showMenu"
      class="flex items-center space-x-2 p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <!-- User Avatar -->
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
        class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      >
        <!-- User Info -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ authStore.userFullName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
            {{ authStore.user?.email }}
          </p>
        </div>

        <!-- Menu Items -->
        <div class="py-1">
          <button
            @click="showKeyboardShortcuts"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <CommandLineIcon class="w-4 h-4 mr-3" />
            Keyboard Shortcuts
          </button>
        </div>
        
        <div class="border-t border-gray-200 dark:border-gray-600 py-1">
          <button
            @click="handleLogout"
            class="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowRightOnRectangleIcon class="w-4 h-4 mr-3" />
            Sign out
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  CommandLineIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import { useConfirmation } from '@composables/useConfirmation'
import { useKeyboardShortcuts } from '@composables/useKeyboardShortcuts'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const { confirmAction } = useConfirmation()
const { showShortcutsHelp } = useKeyboardShortcuts()

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

const showKeyboardShortcuts = () => {
  showMenu.value = false
  showShortcutsHelp()
}

// Close menu when clicking outside
import { onClickOutside } from '@vueuse/core'
const menuRef = ref()
onClickOutside(menuRef, () => {
  showMenu.value = false
})
</script>