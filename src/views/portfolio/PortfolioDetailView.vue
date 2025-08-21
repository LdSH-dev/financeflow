<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Loading State -->
    <div v-if="isLoading" class="animate-fade-in">
      <div class="mb-8">
        <div class="skeleton h-8 w-64 mb-2"></div>
        <div class="skeleton h-4 w-96"></div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <div class="card card-body">
            <div class="skeleton h-64 w-full"></div>
          </div>
        </div>
        <div>
          <div class="card card-body">
            <div class="skeleton h-48 w-full"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Portfolio Content -->
    <div v-else-if="currentPortfolio" class="animate-fade-in">
      <!-- Header -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center space-x-4">
          <button
            @click="goBack"
            class="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon class="w-5 h-5" />
          </button>
          <div>
            <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {{ currentPortfolio.name }}
            </h1>
            <p v-if="currentPortfolio.description" class="text-gray-600 dark:text-gray-400 mt-1">
              {{ currentPortfolio.description }}
            </p>
          </div>
        </div>
        
        <div class="flex items-center space-x-3">
          <router-link
            :to="`/portfolios/${currentPortfolio.id}/assets/add`"
            class="btn btn-primary"
          >
            <PlusIcon class="w-4 h-4 mr-2" />
            Add Asset
          </router-link>
          <button
            @click="editPortfolio"
            class="btn btn-outline"
          >
            <PencilIcon class="w-4 h-4 mr-2" />
            Edit
          </button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <CurrencyDollarIcon class="w-8 h-8 text-primary-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Value</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(currentPortfolio.totalValue, currentPortfolio.currency) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ArrowTrendingUpIcon :class="[
                  'w-8 h-8',
                  currentPortfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                ]" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Gain/Loss</p>
                <p :class="[
                  'text-2xl font-semibold',
                  currentPortfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ formatCurrency(currentPortfolio.dayChange, currentPortfolio.currency) }}
                </p>
                <p :class="[
                  'text-sm',
                  currentPortfolio.dayChange >= 0 ? 'text-green-600' : 'text-red-600'
                ]">
                  {{ currentPortfolio.dayChangePercent >= 0 ? '+' : '' }}{{ Number(currentPortfolio.dayChangePercent || 0).toFixed(2) }}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <ChartBarIcon class="w-8 h-8 text-primary-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Cost</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(currentPortfolio.totalCost, currentPortfolio.currency) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-body">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <BriefcaseIcon class="w-8 h-8 text-primary-600" />
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Assets</p>
                <p class="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {{ currentPortfolio.assets?.length || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Assets Table -->
        <div class="lg:col-span-2">
          <div class="card">
            <div class="card-header flex-between">
              <h3 class="text-lg font-semibold">Assets</h3>
              <router-link
                :to="`/portfolios/${currentPortfolio.id}/assets/add`"
                class="btn btn-primary btn-sm"
              >
                <PlusIcon class="w-4 h-4 mr-1" />
                Add Asset
              </router-link>
            </div>
            <div class="card-body p-0">


              <!-- Assets List -->
              <div v-if="currentPortfolio?.assets && currentPortfolio.assets.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
                <div
                  v-for="asset in currentPortfolio.assets"
                  :key="asset.id"
                  class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex-1">
                      <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                          <span class="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                            {{ asset.symbol.substring(0, 2) }}
                          </span>
                        </div>
                        <div>
                          <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {{ asset.symbol }}
                          </h4>
                          <p class="text-xs text-gray-500 dark:text-gray-400">
                            {{ asset.name }}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 text-right">
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {{ asset.quantity }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Shares</p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {{ formatCurrency(asset.currentPrice, currentPortfolio.currency) }}
                        </p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">Price</p>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {{ formatCurrency(asset.marketValue, currentPortfolio.currency) }}
                        </p>
                        <p :class="[
                          'text-xs',
                          asset.dayChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        ]">
                          {{ asset.dayChangePercent >= 0 ? '+' : '' }}{{ Number(asset.dayChangePercent || 0).toFixed(2) }}%
                        </p>
                      </div>
                    </div>

                    <div class="ml-4">
                      <button
                        @click="editAsset(asset)"
                        class="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900 rounded"
                        title="Edit Asset"
                      >
                        <PencilIcon class="w-4 h-4" />
                      </button>
                      <button
                        @click="deleteAssetConfirm(asset)"
                        class="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded ml-1"
                        title="Remove Asset"
                      >
                        <TrashIcon class="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty Assets State -->
              <div v-else class="p-8 text-center">
                <ChartBarIcon class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No assets found
                </h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                  Add your first asset to start tracking your portfolio.
                </p>
                <router-link
                  :to="`/portfolios/${currentPortfolio.id}/assets/add`"
                  class="btn btn-primary"
                >
                  <PlusIcon class="w-4 h-4 mr-2" />
                  Add First Asset
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Allocation Chart -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold">Asset Allocation</h3>
            </div>
            <div class="card-body">
              <AllocationChart
                v-if="currentPortfolio.assets && currentPortfolio.assets.length > 0"
                :data="allocationData"
                :loading="false"
              />
              <div v-else class="text-center py-8">
                <ChartPieIcon class="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p class="text-gray-600 dark:text-gray-400">
                  Add assets to see allocation
                </p>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="card">
            <div class="card-header">
              <h3 class="text-lg font-semibold">Recent Activity</h3>
            </div>
            <div class="card-body">
              <RecentActivity 
                :portfolio-id="currentPortfolio.id" 
                :loading="false" 
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="text-center py-12">
      <ExclamationTriangleIcon class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Portfolio not found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        The portfolio you're looking for doesn't exist or you don't have access to it.
      </p>
      <router-link
        to="/portfolios"
        class="btn btn-primary"
      >
        Back to Portfolios
      </router-link>
    </div>

    <!-- Edit Asset Modal -->
    <EditAssetModal
      :is-open="isEditModalOpen"
      :asset="selectedAsset"
      :portfolio-id="portfolioId"
      @close="closeEditModal"
      @updated="handleAssetUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { 
  ArrowLeftIcon,
  ArrowPathIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  BriefcaseIcon,
  ChartPieIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'
import { useConfirmation } from '@composables/useConfirmation'

// Components
import AllocationChart from '@components/charts/AllocationChart.vue'
import RecentActivity from '@components/dashboard/RecentActivity.vue'
import EditAssetModal from '@components/modals/EditAssetModal.vue'

// Utils
import { formatCurrency } from '@utils/format'
import type { Asset } from '@types/portfolio'

const router = useRouter()
const route = useRoute()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()
const { confirm } = useConfirmation()

// State
const isLoading = ref(true)
const isEditModalOpen = ref(false)
const selectedAsset = ref<Asset | null>(null)

// Computed
const portfolioId = computed(() => route.params.id as string)
const currentPortfolio = computed(() => portfolioStore.currentPortfolio)

const allocationData = computed(() => {
  if (!currentPortfolio.value?.assets || currentPortfolio.value.assets.length === 0) {
    return { labels: [], datasets: [] }
  }

  const assets = currentPortfolio.value.assets
  const totalValue = currentPortfolio.value.totalValue

  // Group by asset type instead of individual symbols
  const assetTypeMap = new Map<string, number>()
  
  assets.forEach(asset => {
    const type = asset.assetType || 'Other'
    const currentValue = assetTypeMap.get(type) || 0
    assetTypeMap.set(type, currentValue + asset.marketValue)
  })
  
  
  const labels = Array.from(assetTypeMap.keys())
  const data = Array.from(assetTypeMap.values()).map(value => 
    Number(((value / totalValue) * 100).toFixed(1))
  )

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
      ]
    }]
  }
})

// Methods
const loadPortfolio = async () => {
  isLoading.value = true
  
  try {
    const portfolio = await portfolioStore.fetchPortfolio(portfolioId.value, true)
    if (portfolio) {
      portfolioStore.setCurrentPortfolio(portfolio)
      uiStore.setBreadcrumb(['Portfolios', portfolio.name])
    }
  } catch (error) {
    console.error('Failed to load portfolio:', error)
    uiStore.showError('Error', 'Failed to load portfolio details')
  } finally {
    isLoading.value = false
  }
}

const goBack = () => {
  router.back()
}

const editPortfolio = () => {
  router.push(`/portfolios/${portfolioId.value}/edit`)
}

const editAsset = (asset: Asset) => {
  selectedAsset.value = asset
  isEditModalOpen.value = true
}

const closeEditModal = () => {
  isEditModalOpen.value = false
  selectedAsset.value = null
}

const handleAssetUpdated = async () => {
  // Refresh portfolio data to show updated values
  await portfolioStore.invalidatePortfolioCache(portfolioId.value)
}

const deleteAssetConfirm = async (asset: Asset) => {
  const confirmed = await confirm({
    title: 'Remove Asset',
    message: `Are you sure you want to remove "${asset.symbol}" from this portfolio?`,
    type: 'danger',
    confirmText: 'Remove',
    cancelText: 'Cancel'
  })

  if (confirmed) {
    const success = await portfolioStore.removeAsset(portfolioId.value, asset.id)
    // removeAsset already handles success message and data refresh via forceRefreshAll()
  }
}

// Watch for route changes
watch(() => route.params.id, (newId) => {
  if (newId && newId !== portfolioId.value) {
    loadPortfolio()
  }
})

// Watch for portfolio data changes and reload if needed
watch(() => portfolioStore.portfolios, (newPortfolios, oldPortfolios) => {
  // Check if the current portfolio was updated
  const currentId = portfolioId.value
  if (currentId) {
    const newPortfolio = newPortfolios.find(p => p.id === currentId)
    const oldPortfolio = oldPortfolios?.find(p => p.id === currentId)
    
    // If portfolio exists and assets count changed, update current portfolio
    if (newPortfolio && (!oldPortfolio || newPortfolio.assets?.length !== oldPortfolio.assets?.length)) {
      portfolioStore.setCurrentPortfolio(newPortfolio)
    }
  }
}, { deep: true })

// Lifecycle
onMounted(() => {
  loadPortfolio()
})
</script>