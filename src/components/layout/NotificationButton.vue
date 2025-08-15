<template>
  <div class="relative">
    <button
      @click="showNotifications = !showNotifications"
      class="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 relative"
    >
      <BellIcon class="w-6 h-6" />
      
      <!-- Notification badge -->
      <span 
        v-if="unreadCount > 0"
        class="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 transform translate-x-1/2 -translate-y-1/2"
      ></span>
    </button>

    <!-- Notifications dropdown -->
    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform opacity-100 scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <div 
        v-if="showNotifications"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      >
        <!-- Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            <button
              v-if="unreadCount > 0"
              @click="markAllAsRead"
              class="text-xs text-primary-600 hover:text-primary-700"
            >
              Mark all as read
            </button>
          </div>
        </div>

        <!-- Notifications list -->
        <div class="max-h-96 overflow-y-auto">
          <div v-if="notifications.length === 0" class="px-4 py-8 text-center">
            <BellIcon class="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              No notifications
            </p>
          </div>

          <div v-else class="py-1">
            <div 
              v-for="notification in notifications.slice(0, 5)" 
              :key="notification.id"
              :class="[
                'px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-l-4',
                notification.read 
                  ? 'border-transparent' 
                  : 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              ]"
              @click="markAsRead(notification.id)"
            >
              <div class="flex items-start">
                <div class="flex-shrink-0">
                  <component 
                    :is="getNotificationIcon(notification.type)" 
                    class="w-6 h-6 text-gray-400"
                  />
                </div>
                <div class="ml-3 flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ notification.title }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {{ formatRelativeTime(notification.createdAt) }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 5" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button class="text-sm text-primary-600 hover:text-primary-700 font-medium">
            View all notifications
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { 
  BellIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from '@heroicons/vue/24/outline'
import { formatRelativeTime } from '@utils/format'

interface Notification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  read: boolean
  createdAt: string
}

const showNotifications = ref(false)

// Mock notifications - replace with real data
const notifications = ref<Notification[]>([
  {
    id: '1',
    type: 'warning',
    title: 'Price Alert',
    message: 'AAPL has reached your target price of $150.00',
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    id: '2',
    type: 'info',
    title: 'Portfolio Rebalanced',
    message: 'Your Growth Portfolio has been automatically rebalanced',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: '3',
    type: 'success',
    title: 'Dividend Received',
    message: 'You received $45.20 dividend from MSFT',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
])

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length
})

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'warning':
      return ExclamationTriangleIcon
    case 'info':
      return InformationCircleIcon
    case 'success':
      return CheckCircleIcon
    default:
      return BellIcon
  }
}

const markAsRead = (id: string) => {
  const notification = notifications.value.find(n => n.id === id)
  if (notification) {
    notification.read = true
  }
}

const markAllAsRead = () => {
  notifications.value.forEach(n => n.read = true)
}
</script>