<template>
  <div class="container mx-auto px-4 py-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Transactions
        </h1>
        <p class="text-gray-600 dark:text-gray-400 mt-1">
          View and manage your investment transactions
        </p>
      </div>
      
      <div class="flex items-center space-x-4">
        <button
          @click="refreshTransactions"
          :disabled="isRefreshing"
          class="btn btn-outline"
        >
          <ArrowPathIcon 
            :class="['w-4 h-4 mr-2', { 'animate-spin': isRefreshing }]" 
          />
          Refresh
        </button>
        
        <button
          @click="showCreateModal = true"
          class="btn btn-primary"
        >
          <PlusIcon class="w-4 h-4 mr-2" />
          Add Transaction
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <SummaryCard
        title="Total Transactions"
        :value="transactions.length.toString()"
        icon="Squares2X2Icon"
        color="blue"
      />
      <SummaryCard
        title="Buy Orders"
        :value="buyTransactions.toString()"
        icon="ArrowUpIcon"
        color="green"
      />
      <SummaryCard
        title="Sell Orders"
        :value="sellTransactions.toString()"
        icon="ArrowDownIcon"
        color="red"
      />
      <SummaryCard
        title="Total Fees"
        :value="formatCurrency(totalFees)"
        icon="CurrencyDollarIcon"
        color="yellow"
      />
    </div>

    <!-- Filters -->
    <div class="mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- Portfolio Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Portfolio
            </label>
            <select
              v-model="filters.portfolioId"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Portfolios</option>
              <option 
                v-for="portfolio in portfolios" 
                :key="portfolio.id" 
                :value="portfolio.id"
              >
                {{ portfolio.name }}
              </option>
            </select>
          </div>

          <!-- Transaction Type Filter -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <select
              v-model="filters.transactionType"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">All Types</option>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
              <option value="dividend">Dividend</option>
              <option value="split">Split</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date
            </label>
            <input
              v-model="filters.startDate"
              type="date"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date
            </label>
            <input
              v-model="filters.endDate"
              type="date"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>

        <div class="flex justify-between items-center mt-4">
          <button
            @click="clearFilters"
            class="btn btn-outline btn-sm"
          >
            Clear Filters
          </button>
          
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Showing {{ filteredTransactions.length }} of {{ transactions.length }} transactions
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading && !transactions.length" class="animate-fade-in">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div class="p-4">
          <div class="skeleton h-4 w-48 mb-4"></div>
          <div v-for="i in 10" :key="i" class="skeleton h-12 w-full mb-2"></div>
        </div>
      </div>
    </div>

    <!-- Transactions Table -->
    <div v-else-if="filteredTransactions.length > 0" class="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date & Symbol
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Quantity
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Fees
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Total
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Portfolio
              </th>
              <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <tr 
              v-for="transaction in paginatedTransactions" 
              :key="transaction.id"
              class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div>
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ transaction.symbol }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">
                    {{ formatDate(transaction.transactionDate) }}
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getTransactionTypeStyle(transaction.transactionType)
                ]">
                  {{ transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatNumber(transaction.quantity) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatCurrency(transaction.price) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                {{ formatCurrency(transaction.fees) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div :class="[
                  'text-sm font-medium',
                  transaction.transactionType === 'buy' ? 'text-red-600' : 'text-green-600'
                ]">
                  {{ transaction.transactionType === 'buy' ? '-' : '+' }}{{ formatCurrency(transaction.totalAmount) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {{ getPortfolioName(transaction.portfolioId) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex items-center justify-end space-x-2">
                  <button
                    @click="editTransaction(transaction)"
                    class="text-primary-600 hover:text-primary-900"
                    title="Edit Transaction"
                  >
                    <PencilIcon class="w-4 h-4" />
                  </button>
                  <button
                    @click="deleteTransactionConfirm(transaction)"
                    class="text-red-600 hover:text-red-900"
                    title="Delete Transaction"
                  >
                    <TrashIcon class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <p class="text-sm text-gray-700 dark:text-gray-300">
              Showing {{ ((currentPage - 1) * pageSize) + 1 }} to {{ Math.min(currentPage * pageSize, filteredTransactions.length) }} 
              of {{ filteredTransactions.length }} results
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="currentPage = Math.max(1, currentPage - 1)"
              :disabled="currentPage === 1"
              class="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Page {{ currentPage }} of {{ totalPages }}
            </span>
            <button
              @click="currentPage = Math.min(totalPages, currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <CurrencyDollarIcon class="w-16 h-16 mx-auto text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        No transactions found
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        {{ hasFilters ? 'No transactions match your search criteria.' : 'Start by adding your first transaction.' }}
      </p>
      <button
        v-if="!hasFilters"
        @click="showCreateModal = true"
        class="btn btn-primary"
      >
        <PlusIcon class="w-4 h-4 mr-2" />
        Add Your First Transaction
      </button>
      <button
        v-else
        @click="clearFilters"
        class="btn btn-outline"
      >
        Clear Filters
      </button>
    </div>

    <!-- Create/Edit Transaction Modal -->
    <TransactionModal
      v-if="showCreateModal || showEditModal"
      :transaction="selectedTransaction"
      :portfolios="portfolios"
      @close="closeModals"
      @saved="handleTransactionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { 
  ArrowPathIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CurrencyDollarIcon,
  Squares2X2Icon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/vue/24/outline'

// Components
import SummaryCard from '@components/dashboard/SummaryCard.vue'
import TransactionModal from '@components/transaction/TransactionModal.vue'

// Stores
import { usePortfolioStore } from '@stores/portfolio'
import { useUIStore } from '@stores/ui'
import { useConfirmation } from '@composables/useConfirmation'

// Utils
import { formatCurrency, formatDate } from '@utils/format'
import type { Transaction, Portfolio, TransactionType } from '@types/portfolio'

const portfolioStore = usePortfolioStore()
const uiStore = useUIStore()
const { confirm } = useConfirmation()

// State
const isLoading = ref(false)
const isRefreshing = ref(false)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const selectedTransaction = ref<Transaction | null>(null)
const currentPage = ref(1)
const pageSize = ref(25)

// Filters
const filters = ref({
  portfolioId: '',
  transactionType: '' as TransactionType | '',
  startDate: '',
  endDate: ''
})

// Computed
const portfolios = computed(() => portfolioStore.portfolios)
const transactions = computed(() => portfolioStore.transactions)

const filteredTransactions = computed(() => {
  let filtered = [...transactions.value]

  if (filters.value.portfolioId) {
    filtered = filtered.filter(t => t.portfolioId === filters.value.portfolioId)
  }

  if (filters.value.transactionType) {
    filtered = filtered.filter(t => t.transactionType === filters.value.transactionType)
  }

  if (filters.value.startDate) {
    filtered = filtered.filter(t => 
      new Date(t.transactionDate) >= new Date(filters.value.startDate)
    )
  }

  if (filters.value.endDate) {
    filtered = filtered.filter(t => 
      new Date(t.transactionDate) <= new Date(filters.value.endDate)
    )
  }

  // Sort by date descending
  return filtered.sort((a, b) => 
    new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
  )
})

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredTransactions.value.slice(start, end)
})

const totalPages = computed(() => 
  Math.ceil(filteredTransactions.value.length / pageSize.value)
)

const hasFilters = computed(() => 
  filters.value.portfolioId || 
  filters.value.transactionType || 
  filters.value.startDate || 
  filters.value.endDate
)

const buyTransactions = computed(() => 
  transactions.value.filter(t => t.transactionType === 'buy').length
)

const sellTransactions = computed(() => 
  transactions.value.filter(t => t.transactionType === 'sell').length
)

const totalFees = computed(() => 
  transactions.value.reduce((sum, t) => sum + t.fees, 0)
)

// Methods
const refreshTransactions = async () => {
  isRefreshing.value = true
  try {
    await portfolioStore.fetchTransactions()
    uiStore.showSuccess('Success', 'Transactions refreshed successfully')
  } catch (error) {
    console.error('Failed to refresh transactions:', error)
  } finally {
    isRefreshing.value = false
  }
}

const clearFilters = () => {
  filters.value = {
    portfolioId: '',
    transactionType: '',
    startDate: '',
    endDate: ''
  }
  currentPage.value = 1
}

const getTransactionTypeStyle = (type: TransactionType) => {
  switch (type) {
    case 'buy':
      return 'bg-green-100 text-green-800'
    case 'sell':
      return 'bg-red-100 text-red-800'
    case 'dividend':
      return 'bg-blue-100 text-blue-800'
    case 'split':
      return 'bg-yellow-100 text-yellow-800'
    case 'transfer':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getPortfolioName = (portfolioId: string) => {
  const portfolio = portfolios.value.find(p => p.id === portfolioId)
  return portfolio?.name || 'Unknown Portfolio'
}

const editTransaction = (transaction: Transaction) => {
  selectedTransaction.value = transaction
  showEditModal.value = true
}

const deleteTransactionConfirm = async (transaction: Transaction) => {
  const confirmed = await confirm(
    'Delete Transaction',
    `Are you sure you want to delete this ${transaction.transactionType} transaction for ${transaction.symbol}?`,
    'danger'
  )

  if (confirmed) {

    uiStore.showSuccess('Deleted', 'Transaction has been deleted')
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  selectedTransaction.value = null
}

const handleTransactionSaved = () => {
  closeModals()
  refreshTransactions()
}

// Watch for filter changes to reset pagination
watch(filters, () => {
  currentPage.value = 1
}, { deep: true })

// Lifecycle
onMounted(async () => {
  uiStore.setBreadcrumb(['Transactions'])
  
  isLoading.value = true
  try {
    // Load portfolios and transactions
    await Promise.all([
      portfolioStore.fetchPortfolios(),
      portfolioStore.fetchTransactions()
    ])
  } catch (error) {
    console.error('Failed to load data:', error)
  } finally {
    isLoading.value = false
  }
})
</script>