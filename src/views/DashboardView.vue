<template>
  <div class="dashboard-container h-full px-4 sm:px-6 lg:px-8 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {{ userStore.userFullName }}
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <router-link
          to="/portfolios/create"
          class="btn btn-primary"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          New Portfolio
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="animate-fade-in">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div v-for="i in 4" :key="i" class="card card-body">
          <div class="skeleton h-4 w-20 mb-2"></div>
          <div class="skeleton h-8 w-32"></div>
        </div>
      </div>
      <div class="card card-body">
        <div class="skeleton h-6 w-48 mb-4"></div>
        <div class="skeleton h-64 w-full"></div>
      </div>
    </div>

    <!-- Dashboard Content -->
    <div v-else class="animate-fade-in">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Total Portfolio Value"
          :value="formatCurrency(portfolioStore.totalPortfolioValue)"
          :change="portfolioStore.totalDayChange"
          :change-percent="portfolioStore.totalDayChangePercent"
          icon="CurrencyDollarIcon"
        />
        
        <SummaryCard
          title="Total Portfolios"
          :value="portfolioStore.portfolios.length.toString()"
          icon="BriefcaseIcon"
        />
        
        <SummaryCard
          title="Total Gain/Loss"
          :value="formatCurrency(portfolioStore.totalDayChange)"
          :change-percent="portfolioStore.totalDayChangePercent"
          icon="ArrowTrendingUpIcon"
        />
        
        <SummaryCard
          title="Active Assets"
          :value="totalAssets.toString()"
          icon="ChartBarIcon"
        />
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Portfolio Performance Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold">Portfolio Performance</h3>
          </div>
          <div class="card-body">
            <PerformanceChart
              :data="performanceData"
              :loading="chartsLoading"
            />
          </div>
        </div>

        <!-- Asset Allocation Chart -->
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold">Asset Allocation</h3>
          </div>
          <div class="card-body">
            <AllocationChart
              :data="allocationData"
              :loading="chartsLoading"
            />
          </div>
        </div>
      </div>

      <!-- Portfolios Table -->
      <div class="card">
        <div class="card-header flex-between">
          <h3 class="text-lg font-semibold">Your Portfolios</h3>
          <router-link
            to="/portfolios"
            class="text-primary-600 hover:text-primary-700 text-sm font-medium"
          >
            View All
          </router-link>
        </div>
        <div class="card-body p-0">
          <PortfolioTable
            :portfolios="portfolioStore.portfolios.slice(0, 5)"
            :loading="isLoading"
            show-actions
          />
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="mt-8">
        <div class="card">
          <div class="card-header">
            <h3 class="text-lg font-semibold">Recent Activity</h3>
          </div>
          <div class="card-body">
            <RecentActivity :loading="isLoading" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { 
  PlusIcon
} from '@heroicons/vue/24/outline'

// Stores
import { useAuthStore } from '@stores/auth'
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'

// Components
import SummaryCard from '@components/dashboard/SummaryCard.vue'
import PerformanceChart from '@components/charts/PerformanceChart.vue'
import AllocationChart from '@components/charts/AllocationChart.vue'
import PortfolioTable from '@components/portfolio/PortfolioTable.vue'
import RecentActivity from '@components/dashboard/RecentActivity.vue'

// Utils
import { formatCurrency } from '@utils/format'

const userStore = useAuthStore()
const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()

// State
const isLoading = ref(true)

const chartsLoading = ref(true)

// Computed
const totalAssets = computed(() => {
  return portfolioStore.portfolios.reduce(
    (total, portfolio) => total + portfolio.assets.length,
    0
  )
})

// Generate performance data based on real transaction dates
const generatePerformanceData = () => {
  // Get all transactions from all portfolios
  const allTransactions: any[] = []
  
  portfolioStore.portfolios.forEach(portfolio => {
    if (portfolio.assets) {
      portfolio.assets.forEach(asset => {
        // Simulate transaction data based on asset creation
        // In a real system, you would get this from the transactions store
        allTransactions.push({
          date: asset.createdAt || new Date().toISOString(),
          value: asset.totalCost || 0,
          cost: asset.totalCost || 0,
          symbol: asset.symbol
        })
      })
    }
  })
  
  // If no transactions, show current day only
  if (allTransactions.length === 0) {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const currentTotalValue = portfolioStore.portfolios.reduce((acc, portfolio) => acc + portfolio.totalValue, 0)
    const currentTotalCost = portfolioStore.portfolios.reduce((acc, portfolio) => acc + portfolio.totalCost, 0)
    
    return {
      labels: [today],
      datasets: [
        {
          label: 'Total Value',
          data: [currentTotalValue],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Total Cost',
          data: [currentTotalCost],
          borderColor: '#6b7280',
          backgroundColor: 'rgba(107, 114, 128, 0.1)',
          tension: 0.4,
          fill: false
        }
      ]
    }
  }
  
  // Group transactions by date
  const transactionsByDate = new Map()
  
  allTransactions.forEach(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    if (!transactionsByDate.has(date)) {
      transactionsByDate.set(date, { totalCost: 0, count: 0 })
    }
    const dayData = transactionsByDate.get(date)
    dayData.totalCost += transaction.cost
    dayData.count += 1
  })
  
  // Sort dates and create arrays
  const sortedDates = Array.from(transactionsByDate.keys()).sort((a, b) => {
    const dateA = new Date(a.split(' ').reverse().join(' '))
    const dateB = new Date(b.split(' ').reverse().join(' '))
    return dateA.getTime() - dateB.getTime()
  })
  
  const labels = sortedDates
  const totalCostData: number[] = []
  const totalValueData: number[] = []
  
  let accumulatedCost = 0
  
  sortedDates.forEach(date => {
    const dayData = transactionsByDate.get(date)
    accumulatedCost += dayData.totalCost
    totalCostData.push(accumulatedCost)
    
    // Calculate current value based on accumulated cost with some market variation
    // For the last date, use actual current value
    const isLastDate = date === sortedDates[sortedDates.length - 1]
    if (isLastDate) {
      const currentTotalValue = portfolioStore.portfolios.reduce((acc, portfolio) => acc + portfolio.totalValue, 0)
      totalValueData.push(currentTotalValue)
    } else {
      // For historical dates, estimate value based on cost with some growth
      const estimatedValue = accumulatedCost * (1 + Math.random() * 0.1 - 0.05) // ±5% variation
      totalValueData.push(estimatedValue)
    }
  })
  
  return {
    labels,
    datasets: [
      {
        label: 'Total Value',
        data: totalValueData,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Total Cost',
        data: totalCostData,
        borderColor: '#6b7280',
        backgroundColor: 'rgba(107, 114, 128, 0.1)',
        tension: 0.4,
        fill: false
      }
    ]
  }
}

const performanceData = computed(() => {
  if (portfolioStore.portfolios.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }
  
  return generatePerformanceData()
})

const allocationData = computed(() => {
  if (portfolioStore.portfolios.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  // Aggregate assets across all portfolios by type
  const allAssets = portfolioStore.portfolios.flatMap(p => p.assets || [])
  
  const assetTypeMap = new Map<string, number>()
  
  allAssets.forEach(asset => {
    const type = asset.assetType || 'Other'
    const currentValue = assetTypeMap.get(type) || 0
    assetTypeMap.set(type, currentValue + asset.marketValue)
  })
  

  if (assetTypeMap.size === 0) {
    return {
      labels: ['No Assets'],
      datasets: [{
        data: [100],
        backgroundColor: ['#E5E7EB']
      }]
    }
  }

  const labels = Array.from(assetTypeMap.keys())
  const data = Array.from(assetTypeMap.values())
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
  ]

  return {
    labels: labels,
    datasets: [{
      data: data,
      backgroundColor: colors.slice(0, labels.length)
    }]
  }
})

// Methods
const loadDashboardData = async () => {
  try {
    isLoading.value = true
    
    // Load portfolios
    await portfolioStore.fetchPortfolios()
    
    // Load additional dashboard data

    
    // Simulate chart loading
    setTimeout(() => {
      chartsLoading.value = false
    }, 1000)
    
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
    uiStore.showError('Loading Error', 'Failed to load dashboard data')
  } finally {
    isLoading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadDashboardData()
})

// Set breadcrumb
uiStore.setBreadcrumb(['Dashboard'])
</script>

