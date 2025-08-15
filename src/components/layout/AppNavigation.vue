<template>
  <!-- Mobile menu backdrop -->
  <div 
    v-if="!uiStore.sidebarCollapsed"
    class="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
    @click="uiStore.toggleSidebar()"
  ></div>

  <!-- Sidebar -->
  <div 
    :class="[
      'relative z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out',
      'lg:translate-x-0 lg:static lg:inset-0',
      uiStore.sidebarCollapsed ? '-translate-x-full lg:-translate-x-full' : 'translate-x-0',
      'fixed inset-y-0 left-0 lg:relative lg:block'
    ]"
  >
    <!-- Logo and brand -->
    <div class="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <span class="text-white font-bold text-lg">F</span>
        </div>
        <span class="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">
          FinanceFlow
        </span>
      </div>
      
      <button
        @click="uiStore.toggleSidebar()"
        class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
      >
        <XMarkIcon class="w-6 h-6" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
      <NavigationItem
        v-for="item in navigationItems"
        :key="item.name"
        :item="item"
        :collapsed="false"
      />


    </nav>

    <!-- User menu at bottom -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-700">
      <UserMenu :collapsed="false" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { 
  Bars3Icon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  HomeIcon,
  BriefcaseIcon,
  ChartBarIcon,
  EyeIcon,
  BellIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  UserIcon
} from '@heroicons/vue/24/outline'

import { useUIStore } from '@stores/ui'
import NavigationItem from './NavigationItem.vue'
import UserMenu from './UserMenu.vue'
import Breadcrumb from './Breadcrumb.vue'
import NotificationButton from './NotificationButton.vue'
import ThemeToggle from './ThemeToggle.vue'
import ProfileMenu from './ProfileMenu.vue'

const uiStore = useUIStore()

// Screen size detection
const isLgScreen = ref(false)

const checkScreenSize = () => {
  isLgScreen.value = window.innerWidth >= 1024
}

onMounted(() => {
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

// Navigation items - apenas os 2 módulos principais
const navigationItems = computed(() => [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    current: false
  },
  {
    name: 'Portfolios',
    href: '/portfolios',
    icon: BriefcaseIcon,
    current: false
  }
])

const secondaryItems = computed(() => [
  // Removemos os itens secundários conforme solicitado
])
</script>