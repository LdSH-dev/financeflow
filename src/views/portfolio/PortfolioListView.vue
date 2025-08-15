<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Portfolios
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Manage your investment portfolios
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <router-link
          to="/portfolios/create"
          class="btn btn-primary"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Create Portfolio
        </router-link>
      </div>
    </div>



    <!-- Loading State -->
    <div v-if="portfolioStore.isLoading && !portfolioStore.portfolios.length" class="animate-fade-in">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div v-for="i in 6" :key="i" class="card card-body">
          <div class="skeleton h-4 w-32 mb-2"></div>
          <div class="skeleton h-8 w-24 mb-4"></div>
          <div class="skeleton h-4 w-full mb-2"></div>
          <div class="skeleton h-4 w-3/4"></div>
        </div>
      </div>
    </div>

    <!-- Portfolio Grid -->
    <div v-else-if="filteredPortfolios.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="portfolio in filteredPortfolios"
        :key="portfolio.id"
        class="card hover:shadow-lg transition-shadow duration-200"
      >
        <div class="card-body">
          <!-- Portfolio Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {{ portfolio.name }}
              </h3>
              <p v-if="portfolio.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ portfolio.description }}
              </p>
            </div>
            <div class="flex items-center space-x-1 ml-2">
              <button
                @click="editPortfolio(portfolio)"
                class="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded"
                title="Edit Portfolio"
              >
                <PencilIcon class="w-4 h-4" />
              </button>
              <button
                @click="deletePortfolioConfirm(portfolio)"
                class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                title="Delete Portfolio"
              >
                <TrashIcon class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Portfolio Stats -->
          <div class="space-y-3">
            <!-- Total Value -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Value</span>
              <span class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {{ formatCurrency(portfolio.totalValue) }}
              </span>
            </div>

            <!-- Day Change -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Today's Change</span>
              <div class="flex items-center space-x-1">
                <span :class="[
                  'text-sm font-medium',
                  portfolio.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ portfolio.dayChangePercent >= 0 ? '+' : '' }}{{ Number(portfolio.dayChangePercent || 0).toFixed(2) }}%
                </span>
                <span :class="[
                  'text-xs',
                  portfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  ({{ portfolio.dayChange >= 0 ? '+' : '' }}{{ formatCurrency(portfolio.dayChange) }})
                </span>
              </div>
            </div>

            <!-- Assets Count -->
            <div class="flex items-center justify-between">
              <span class="text-sm text-gray-600 dark:text-gray-400">Assets</span>
              <span class="text-sm text-gray-900 dark:text-gray-100">
                {{ portfolio.assets?.length || 0 }} assets
              </span>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex space-x-2">
              <router-link
                :to="`/portfolios/${portfolio.id}`"
                class="flex-1 btn btn-primary btn-sm"
              >
                View Details
              </router-link>
              <router-link
                :to="`/portfolios/${portfolio.id}/assets/add`"
                class="btn btn-outline btn-sm"
                title="Add Asset"
              >
                <PlusIcon class="w-4 h-4" />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <BriefcaseIcon class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No portfolios found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
                        Create your first portfolio to get started.
      </p>
      <router-link
        to="/portfolios/create"
        class="btn btn-primary"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Create Your First Portfolio
      </router-link>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  BriefcaseIcon
} from '@heroicons/vue/24/outline'
import { useRouter } from 'vue-router'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'
import { useConfirmation } from '@composables/useConfirmation'

// Utils
import { formatCurrency } from '@utils/format'
import type { Portfolio } from '@types/portfolio'

const router = useRouter()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()
const { confirm } = useConfirmation()

// State

// Computed
const filteredPortfolios = computed(() => {
  
  return [...portfolioStore.portfolios]
})

// Methods



const editPortfolio = (portfolio: Portfolio) => {
  router.push(`/portfolios/${portfolio.id}/edit`)
}

const deletePortfolioConfirm = async (portfolio: Portfolio) => {
  const confirmed = await confirm({
    title: 'Delete Portfolio',
    message: `Are you sure you want to delete "${portfolio.name}"? This action cannot be undone.`,
    type: 'danger',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    const success = await portfolioStore.deletePortfolio(portfolio.id)
    if (success) {
      uiStore.showSuccess('Deleted', `Portfolio "${portfolio.name}" has been deleted`)
    }
  }
}

// Watch for filter changes to update store


// Lifecycle
onMounted(async () => {
  // Set breadcrumb
  uiStore.setBreadcrumb(['Portfolios'])
  
  // Load portfolios if not already loaded
  if (portfolioStore.portfolios.length === 0) {
    await portfolioStore.fetchPortfolios()
  } else {
  }
})
</script>