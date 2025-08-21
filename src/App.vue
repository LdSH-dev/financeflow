<template>
  <div id="app" :class="{ dark: isDarkMode }">
    <!-- Loading Screen -->
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
    >
      <div class="text-center">
        <div class="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
          FinanceFlow
        </h2>
        <p class="text-gray-600 dark:text-gray-400 mt-2">
          Loading your portfolio...
        </p>
      </div>
    </div>

    <!-- Main Application -->
    <div v-else class="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div v-if="isAuthenticated" class="h-screen relative">
        <!-- Navigation Sidebar -->
        <AppNavigation />

        <!-- Main Content Area -->
        <div class="h-full w-full transition-all duration-300" :class="uiStore.sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'">
          <div class="flex flex-col h-full w-full overflow-hidden">
            <!-- Top Navigation Bar -->
            <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
              <!-- Mobile menu button -->
              <button
                @click="uiStore.toggleSidebar()"
                class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 lg:hidden"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <!-- Breadcrumb -->
              <div class="flex-1 px-4">
                <nav class="flex" aria-label="Breadcrumb">
                  <ol class="flex items-center space-x-2">
                    <li v-for="(item, index) in uiStore.breadcrumb" :key="index">
                      <div class="flex items-center">
                        <span v-if="index > 0" class="text-gray-400 mx-2">/</span>
                        <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {{ item }}
                        </span>
                      </div>
                    </li>
                  </ol>
                </nav>
              </div>
            </div>
          </header>

          <!-- Main Content -->
          <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900 w-full">
            <!-- Router View with transitions -->
            <router-view v-slot="{ Component, route }">
              <transition
                :name="route.meta.transition || 'fade'"
                mode="out-in"
                appear
              >
                <component :is="Component" :key="route.path" />
              </transition>
            </router-view>
          </main>
          </div>
        </div>
      </div>

      <!-- Unauthenticated content -->
      <div v-else>
        <router-view v-slot="{ Component, route }">
          <transition
            :name="route.meta.transition || 'fade'"
            mode="out-in"
            appear
          >
            <component :is="Component" :key="route.path" />
          </transition>
        </router-view>
      </div>

      <!-- Global Modals -->
      <Teleport to="body">
        <!-- Confirmation Modal -->
        <ConfirmationModal
          v-if="confirmationModal.show"
          :title="confirmationModal.title"
          :message="confirmationModal.message"
          :type="confirmationModal.type"
          :loading="confirmationModal.loading"
          @confirm="handleConfirmation(true)"
          @cancel="handleConfirmation(false)"
        />

        
      </Teleport>

      <!-- Toast Container -->
      <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>

      <!-- Offline Indicator -->
      <div
        v-if="!isOnline"
        class="fixed bottom-4 left-4 z-50 bg-warning-600 text-white px-4 py-2 rounded-lg shadow-lg"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <span class="font-medium">You're offline</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

// Stores
import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import { usePortfolioStore } from '@stores/portfolio'

// Components
import AppNavigation from '@components/layout/AppNavigation.vue'
import ConfirmationModal from '@components/modals/ConfirmationModal.vue'


// Composables
import { useOnline } from '@vueuse/core'
import { useConfirmation } from '@composables/useConfirmation'
import { useKeyboardShortcuts } from '@composables/useKeyboardShortcuts'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const portfolioStore = usePortfolioStore()

// Reactive state
const isLoading = ref(true)
const isOnline = useOnline()

// Store refs
const { isAuthenticated, user } = storeToRefs(authStore)
const { isDarkMode, confirmationModal } = storeToRefs(uiStore)

// Composables
const { handleConfirmation } = useConfirmation()

// Initialize keyboard shortcuts
useKeyboardShortcuts()

// Computed properties
const currentYear = computed(() => new Date().getFullYear())

// Application initialization
onMounted(async () => {
  try {
    // Initialize theme
    uiStore.initializeTheme()
    
    // Check for existing authentication
    await authStore.initializeAuth()
    
    // If authenticated, load initial data
    if (isAuthenticated.value) {
      await Promise.all([
        portfolioStore.fetchPortfolios(),
        // Add other initial data loads here
      ])
    }
  } catch (error) {
    console.error('Failed to initialize application:', error)
    // Handle initialization errors gracefully
  } finally {
    // Add a minimum loading time for better UX
    setTimeout(() => {
      isLoading.value = false
    }, 1000)
  }
})

// Cleanup on unmount
onUnmounted(() => {
  // Clean up any subscriptions or timers
})

// Handle route changes
router.beforeEach((to, from, next) => {
  // Check authentication requirements
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'login', query: { redirect: to.fullPath } })
  } else if (to.meta.requiresGuest && isAuthenticated.value) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

// Handle errors globally
const handleGlobalError = (error: Error) => {
  console.error('Global error:', error)
  uiStore.showNotification({
    type: 'error',
    title: 'Something went wrong',
    message: error.message || 'An unexpected error occurred',
  })
}

// Global error handler
window.addEventListener('error', (event) => {
  handleGlobalError(new Error(event.message))
})

window.addEventListener('unhandledrejection', (event) => {
  handleGlobalError(new Error(event.reason))
})

// Performance monitoring
if (import.meta.env.DEV) {
  // Log performance metrics in development
  const perfObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'navigation') {
        
      }
    }
  })
  
  perfObserver.observe({ entryTypes: ['navigation'] })
}
</script>

<style scoped>
/* Transition animations */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(-100%);
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.3s ease;
}

.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
}

/* Loading animations */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0 !important;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }
}
</style>