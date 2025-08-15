<template>
  <div class="fixed inset-0 z-50 overflow-y-auto">
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <!-- Background overlay -->
      <div 
        class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        @click="$emit('close')"
      ></div>

      <!-- Modal panel -->
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <!-- Header -->
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
              {{ isEdit ? 'Edit Transaction' : 'Add Transaction' }}
            </h3>
            <button
              @click="$emit('close')"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Portfolio Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Portfolio *
              </label>
              <select
                v-model="form.portfolioId"
                @change="onPortfolioChange"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a portfolio</option>
                <option 
                  v-for="portfolio in portfolios" 
                  :key="portfolio.id" 
                  :value="portfolio.id"
                >
                  {{ portfolio.name }}
                </option>
              </select>
            </div>

            <!-- Asset Selection -->
            <div v-if="form.portfolioId">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset *
              </label>
              <select
                v-model="form.assetId"
                @change="onAssetChange"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select an asset</option>
                <option 
                  v-for="asset in portfolioAssets" 
                  :key="asset.id" 
                  :value="asset.id"
                >
                  {{ asset.symbol }} - {{ asset.name }}
                </option>
              </select>
            </div>

            <!-- Transaction Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Type *
              </label>
              <select
                v-model="form.transactionType"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select type</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
                <option value="dividend">Dividend</option>
                <option value="split">Split</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <!-- Symbol (auto-filled from asset) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Symbol *
              </label>
              <input
                v-model="form.symbol"
                type="text"
                required
                readonly
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Quantity -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantity *
              </label>
              <input
                v-model.number="form.quantity"
                type="number"
                step="0.00000001"
                min="0"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <p v-if="selectedAsset && form.transactionType === 'sell'" class="text-xs text-gray-500 mt-1">
                Available: {{ formatNumber(selectedAsset.quantity) }}
              </p>
            </div>

            <!-- Price -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price per Share *
              </label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Fees -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fees
              </label>
              <input
                v-model.number="form.fees"
                type="number"
                step="0.01"
                min="0"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Transaction Date -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Transaction Date *
              </label>
              <input
                v-model="form.transactionDate"
                type="datetime-local"
                required
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <!-- Notes -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                v-model="form.notes"
                rows="3"
                class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Optional notes about this transaction"
              ></textarea>
            </div>

            <!-- Total Calculation -->
            <div v-if="form.quantity && form.price" class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Subtotal:
                </span>
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(form.quantity * form.price) }}
                </span>
              </div>
              <div v-if="form.fees" class="flex justify-between items-center mt-1">
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Fees:
                </span>
                <span class="text-sm text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(form.fees) }}
                </span>
              </div>
              <div class="flex justify-between items-center mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <span class="text-base font-semibold text-gray-900 dark:text-gray-100">
                  Total:
                </span>
                <span class="text-base font-semibold text-gray-900 dark:text-gray-100">
                  {{ formatCurrency(calculateTotal()) }}
                </span>
              </div>
            </div>
          </form>
        </div>

        <!-- Footer -->
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="handleSubmit"
            :disabled="!isFormValid || isSubmitting"
            class="w-full sm:w-auto sm:ml-3 btn btn-primary"
          >
            <span v-if="isSubmitting" class="animate-spin mr-2">⏳</span>
            {{ isEdit ? 'Update Transaction' : 'Add Transaction' }}
          </button>
          <button
            @click="$emit('close')"
            type="button"
            class="mt-3 w-full sm:mt-0 sm:w-auto btn btn-outline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'

// Types
import type { Transaction, Portfolio, Asset, TransactionType, CreateTransactionRequest } from '@types/portfolio'

// Utils
import { formatCurrency } from '@utils/format'

// Props
interface Props {
  transaction?: Transaction | null
  portfolios: Portfolio[]
}

const props = withDefaults(defineProps<Props>(), {
  transaction: null
})

// Emits
const emit = defineEmits<{
  close: []
  saved: [transaction: Transaction]
}>()

// State
const isSubmitting = ref(false)

const form = ref({
  portfolioId: '',
  assetId: '',
  transactionType: '' as TransactionType | '',
  symbol: '',
  quantity: 0,
  price: 0,
  fees: 0,
  transactionDate: '',
  notes: ''
})

// Computed
const isEdit = computed(() => !!props.transaction)

const selectedPortfolio = computed(() => 
  props.portfolios.find(p => p.id === form.value.portfolioId)
)

const portfolioAssets = computed(() => 
  selectedPortfolio.value?.assets || []
)

const selectedAsset = computed(() => 
  portfolioAssets.value.find(a => a.id === form.value.assetId)
)

const isFormValid = computed(() => 
  form.value.portfolioId &&
  form.value.assetId &&
  form.value.transactionType &&
  form.value.symbol &&
  form.value.quantity > 0 &&
  form.value.price >= 0 &&
  form.value.transactionDate
)

// Methods
const calculateTotal = () => {
  const subtotal = form.value.quantity * form.value.price
  if (form.value.transactionType === 'buy') {
    return subtotal + (form.value.fees || 0)
  } else {
    return subtotal - (form.value.fees || 0)
  }
}

const onPortfolioChange = () => {
  form.value.assetId = ''
  form.value.symbol = ''
}

const onAssetChange = () => {
  if (selectedAsset.value) {
    form.value.symbol = selectedAsset.value.symbol
    // Pre-fill with current price if creating new transaction
    if (!isEdit.value) {
      form.value.price = selectedAsset.value.currentPrice
    }
  }
}

const handleSubmit = async () => {
  if (!isFormValid.value || isSubmitting.value) return

  isSubmitting.value = true
  try {
    // Validate sell transaction doesn't exceed available quantity
    if (form.value.transactionType === 'sell' && selectedAsset.value) {
      if (form.value.quantity > selectedAsset.value.quantity) {
        throw new Error(`Cannot sell ${form.value.quantity} shares. Only ${selectedAsset.value.quantity} available.`)
      }
    }

    const transactionData: CreateTransactionRequest = {
      assetId: form.value.assetId,
      transactionType: form.value.transactionType,
      symbol: form.value.symbol,
      quantity: form.value.quantity,
      price: form.value.price,
      fees: form.value.fees || 0,
      transactionDate: form.value.transactionDate,
      notes: form.value.notes || undefined
    }


    
    
    // Mock successful response
    const newTransaction: Transaction = {
      id: Math.random().toString(),
      portfolioId: form.value.portfolioId,
      assetId: form.value.assetId,
      transactionType: form.value.transactionType,
      symbol: form.value.symbol,
      quantity: form.value.quantity,
      price: form.value.price,
      fees: form.value.fees || 0,
      totalAmount: calculateTotal(),
      transactionDate: form.value.transactionDate,
      notes: form.value.notes,
      createdAt: new Date().toISOString()
    }

    emit('saved', newTransaction)
  } catch (error) {
    console.error('Failed to save transaction:', error)
    
  } finally {
    isSubmitting.value = false
  }
}

// Initialize form
const initializeForm = () => {
  if (props.transaction) {
    // Edit mode - populate form with transaction data
    form.value = {
      portfolioId: props.transaction.portfolioId,
      assetId: props.transaction.assetId,
      transactionType: props.transaction.transactionType,
      symbol: props.transaction.symbol,
      quantity: props.transaction.quantity,
      price: props.transaction.price,
      fees: props.transaction.fees,
      transactionDate: props.transaction.transactionDate.slice(0, 16), // Format for datetime-local
      notes: props.transaction.notes || ''
    }
  } else {
    // Create mode - set defaults
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset()) // Adjust for timezone
    
    form.value = {
      portfolioId: '',
      assetId: '',
      transactionType: '',
      symbol: '',
      quantity: 0,
      price: 0,
      fees: 0,
      transactionDate: now.toISOString().slice(0, 16),
      notes: ''
    }
  }
}

// Lifecycle
onMounted(() => {
  initializeForm()
})

// Watch for transaction prop changes
watch(() => props.transaction, () => {
  initializeForm()
}, { immediate: true })
</script>