<template>
  <div>
    <div v-if="loading || isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="flex items-center space-x-4">
        <div class="skeleton w-10 h-10 rounded-full"></div>
        <div class="flex-1 space-y-2">
          <div class="skeleton h-4 w-3/4"></div>
          <div class="skeleton h-3 w-1/2"></div>
        </div>
      </div>
    </div>

    <div v-else-if="!activities.length" class="text-center py-8">
      <ClockIcon class="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p class="text-gray-600 dark:text-gray-400">No recent activity</p>
    </div>

    <div v-else class="space-y-4">
      <div 
        v-for="activity in activities" 
        :key="activity.id"
        class="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <!-- Activity Icon -->
        <div 
          :class="[
            'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
            getActivityColorClass(activity.type)
          ]"
        >
          <component :is="getActivityIcon(activity.type)" class="w-5 h-5" />
        </div>

        <!-- Activity Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm text-gray-900 dark:text-gray-100">
            {{ activity.description }}
          </p>
          <div class="flex items-center mt-1 space-x-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatRelativeTime(activity.timestamp) }}
            </span>
            <span v-if="activity.portfolio || activity.portfolio_name" class="text-xs text-primary-600 dark:text-primary-400">
              {{ activity.portfolio || activity.portfolio_name }}
            </span>
          </div>
        </div>

        <!-- Activity Value -->
        <div v-if="activity.value || activity.total_amount" class="flex-shrink-0">
          <span 
            :class="[
              'text-sm font-medium',
              activity.type === 'buy' || activity.type === 'dividend' 
                ? 'text-success-600' 
                : activity.type === 'sell' 
                  ? 'text-danger-600' 
                  : 'text-gray-600 dark:text-gray-400'
            ]"
          >
            {{ formatCurrency(activity.value || activity.total_amount || 0) }}
          </span>
        </div>
      </div>

      <!-- Show More Button -->
      <div v-if="activities.length >= 5" class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <router-link 
          to="/transactions"
          class="text-primary-600 hover:text-primary-700 text-sm font-medium"
        >
          View All Transactions
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { 
  ClockIcon,
  PlusIcon,
  MinusIcon,
  CurrencyDollarIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'
import { formatCurrency, formatRelativeTime } from '@utils/format'
import { portfolioAPI } from '@utils/api'

interface Activity {
  id: string
  type: 'buy' | 'sell' | 'dividend' | 'split' | 'alert' | 'rebalance'
  description: string
  portfolio?: string
  portfolio_name?: string
  value?: number
  total_amount?: number
  timestamp: string
}

interface Props {
  loading?: boolean
}

const props = defineProps<Props>()

// Real data from API
const activities = ref<Activity[]>([])
const isLoading = ref(false)

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'buy':
      return PlusIcon
    case 'sell':
      return MinusIcon
    case 'dividend':
      return CurrencyDollarIcon
    case 'split':
      return ArrowPathIcon
    case 'alert':
      return ExclamationTriangleIcon
    case 'rebalance':
      return ArrowPathIcon
    default:
      return ClockIcon
  }
}

const getActivityColorClass = (type: Activity['type']) => {
  switch (type) {
    case 'buy':
      return 'bg-success-100 text-success-600 dark:bg-success-900 dark:text-success-400'
    case 'sell':
      return 'bg-danger-100 text-danger-600 dark:bg-danger-900 dark:text-danger-400'
    case 'dividend':
      return 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400'
    case 'split':
      return 'bg-warning-100 text-warning-600 dark:bg-warning-900 dark:text-warning-400'
    case 'alert':
      return 'bg-warning-100 text-warning-600 dark:bg-warning-900 dark:text-warning-400'
    case 'rebalance':
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
    default:
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
  }
}

const loadActivities = async () => {
  if (props.loading) return
  
  isLoading.value = true
  try {
    const response = await portfolioAPI.getRecentActivities(5)
    if (response.success) {
      activities.value = response.data
    }
  } catch (error) {
    console.error('Failed to load activities:', error)
    // Fallback to empty array
    activities.value = []
  } finally {
    isLoading.value = false
  }
}

// Listen for portfolio activities changes
const handleActivitiesChanged = () => {
  loadActivities()
}

// Expose loadActivities for external refresh
defineExpose({
  loadActivities
})

onMounted(() => {
  loadActivities()
  // Listen for portfolio activities changes
  window.addEventListener('portfolio-activities-changed', handleActivitiesChanged)
})

onUnmounted(() => {
  window.removeEventListener('portfolio-activities-changed', handleActivitiesChanged)
})
</script>