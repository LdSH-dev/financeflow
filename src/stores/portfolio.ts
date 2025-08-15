import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { 
  Portfolio, 
  Asset, 
  Transaction, 
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  AddAssetRequest,
  CreateTransactionRequest,
  PortfolioFilters,
  AssetFilters
} from '@types/portfolio'
import { portfolioAPI, assetAPI, transactionAPI } from '@utils/api'
import { useUIStore } from './ui'

export const usePortfolioStore = defineStore('portfolio', () => {
  // State
  const portfolios = ref<Portfolio[]>([])
  const currentPortfolio = ref<Portfolio | null>(null)
  const transactions = ref<Transaction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Filters
  const portfolioFilters = ref<PortfolioFilters>({
    search: '',
    sortBy: 'name',
    sortOrder: 'asc'
  })

  const assetFilters = ref<AssetFilters>({
    search: '',
    sortBy: 'marketValue',
    sortOrder: 'desc'
  })

  // Getters
  const totalPortfolioValue = computed(() => {
    return portfolios.value.reduce((total, portfolio) => total + portfolio.totalValue, 0)
  })

  const totalDayChange = computed(() => {
    return portfolios.value.reduce((total, portfolio) => total + portfolio.dayChange, 0)
  })

  const totalDayChangePercent = computed(() => {
    const totalValue = totalPortfolioValue.value
    return totalValue > 0 ? (totalDayChange.value / totalValue) * 100 : 0
  })

  const filteredPortfolios = computed(() => {
    let filtered = [...portfolios.value]

    // Apply search filter
    if (portfolioFilters.value.search) {
      const search = portfolioFilters.value.search.toLowerCase()
      filtered = filtered.filter(portfolio => 
        portfolio.name.toLowerCase().includes(search) ||
        portfolio.description.toLowerCase().includes(search)
      )
    }

    // Apply asset type filter
    if (portfolioFilters.value.assetType && portfolioFilters.value.assetType.length > 0) {
      filtered = filtered.filter(portfolio =>
        portfolio.assets.some(asset => 
          portfolioFilters.value.assetType!.includes(asset.assetType)
        )
      )
    }

    // Apply value range filters
    if (portfolioFilters.value.minValue !== undefined) {
      filtered = filtered.filter(portfolio => portfolio.totalValue >= portfolioFilters.value.minValue!)
    }

    if (portfolioFilters.value.maxValue !== undefined) {
      filtered = filtered.filter(portfolio => portfolio.totalValue <= portfolioFilters.value.maxValue!)
    }

    // Apply sorting
    if (portfolioFilters.value.sortBy) {
      const sortKey = portfolioFilters.value.sortBy
      const sortOrder = portfolioFilters.value.sortOrder || 'asc'

      filtered.sort((a, b) => {
        let aValue: any = a[sortKey as keyof Portfolio]
        let bValue: any = b[sortKey as keyof Portfolio]

        // Handle date sorting
        if (sortKey === 'createdAt') {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        }

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        } else {
          return aValue > bValue ? 1 : -1
        }
      })
    }

    return filtered
  })

  const currentPortfolioAssets = computed(() => {
    if (!currentPortfolio.value) return []

    let filtered = [...currentPortfolio.value.assets]

    // Apply search filter
    if (assetFilters.value.search) {
      const search = assetFilters.value.search.toLowerCase()
      filtered = filtered.filter(asset => 
        asset.symbol.toLowerCase().includes(search) ||
        asset.name.toLowerCase().includes(search) ||
        asset.sector?.toLowerCase().includes(search)
      )
    }

    // Apply asset type filter
    if (assetFilters.value.assetType && assetFilters.value.assetType.length > 0) {
      filtered = filtered.filter(asset => 
        assetFilters.value.assetType!.includes(asset.assetType)
      )
    }

    // Apply sector filter
    if (assetFilters.value.sector && assetFilters.value.sector.length > 0) {
      filtered = filtered.filter(asset => 
        asset.sector && assetFilters.value.sector!.includes(asset.sector)
      )
    }

    // Apply weight range filters
    if (assetFilters.value.minWeight !== undefined) {
      filtered = filtered.filter(asset => asset.weight >= assetFilters.value.minWeight!)
    }

    if (assetFilters.value.maxWeight !== undefined) {
      filtered = filtered.filter(asset => asset.weight <= assetFilters.value.maxWeight!)
    }

    // Apply sorting
    if (assetFilters.value.sortBy) {
      const sortKey = assetFilters.value.sortBy
      const sortOrder = assetFilters.value.sortOrder || 'desc'

      filtered.sort((a, b) => {
        let aValue: any = a[sortKey as keyof Asset]
        let bValue: any = b[sortKey as keyof Asset]

        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase()
          bValue = bValue.toLowerCase()
        }

        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1
        } else {
          return aValue > bValue ? 1 : -1
        }
      })
    }

    return filtered
  })

  const portfolioById = computed(() => {
    return (id: string) => portfolios.value.find(p => p.id === id)
  })

  const assetById = computed(() => {
    return (portfolioId: string, assetId: string) => {
      const portfolio = portfolios.value.find(p => p.id === portfolioId)
      return portfolio?.assets.find(a => a.id === assetId)
    }
  })

  // Cache invalidation utilities
  const invalidatePortfolioCache = async (portfolioId: string): Promise<void> => {
    // Force refresh of specific portfolio data from server
    await fetchPortfolio(portfolioId, true)
    
    // Update current portfolio if it's the one being invalidated
    const updatedPortfolio = portfolios.value.find(p => p.id === portfolioId)
    if (updatedPortfolio && currentPortfolio.value?.id === portfolioId) {
      currentPortfolio.value = updatedPortfolio
    }
    
    // Also refresh recent activities since they might have changed
    await refreshRecentActivities()
  }

  const refreshRecentActivities = async (): Promise<void> => {
    // This will be used to trigger refresh of recent activities component
    // The component should listen to this event or we can emit a global event
    const event = new CustomEvent('portfolio-activities-changed')
    window.dispatchEvent(event)
  }

  const forceRefreshAll = async (): Promise<void> => {
    
    // Store current portfolio ID if exists
    const currentPortfolioId = currentPortfolio.value?.id
    
    // Refresh all portfolios
    await fetchPortfolios()
    
    // If we had a current portfolio, refresh it specifically
    if (currentPortfolioId) {
      const refreshedPortfolio = await fetchPortfolio(currentPortfolioId, true)
      if (refreshedPortfolio) {
        currentPortfolio.value = refreshedPortfolio
      }
    }
    
    // Refresh recent activities
    await refreshRecentActivities()
    
  }

  const invalidateAllPortfoliosCache = async (): Promise<void> => {
    // Force refresh of all portfolios data from server
    await fetchPortfolios()
  }

  // Actions
  const fetchPortfolios = async (): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioAPI.getPortfolios({
        includeAssets: true,
        includePerformance: true
      })

      
      // Helper function to convert string numbers to actual numbers
      const convertPortfolioData = (portfolio: any) => ({
        ...portfolio,
        totalValue: Number(portfolio.totalValue) || 0,
        totalCost: Number(portfolio.totalCost) || 0,
        dayChange: Number(portfolio.dayChange) || 0,
        dayChangePercent: Number(portfolio.dayChangePercent) || 0,
        assets: portfolio.assets?.map((asset: any) => ({
          ...asset,
          dayChange: Number(asset.dayChange) || 0,
          dayChangePercent: Number(asset.dayChangePercent) || 0,
        })) || []
      })

      // Check if response is an array (direct data) or wrapped in success object
      if (Array.isArray(response)) {
        const convertedData = response.map(convertPortfolioData)
        portfolios.value = convertedData
      } else if (response.success && response.data) {
        const convertedData = response.data.map(convertPortfolioData)
        portfolios.value = convertedData
      } else {
        console.error('❌ API response format not recognized:', response)
      }
    } catch (err: any) {
      console.error('💥 Error fetching portfolios:', err)
      console.error('📊 Error response:', err.response)
      console.error('🔍 Error status:', err.response?.status)
      console.error('📝 Error data:', err.response?.data)
      
      error.value = err.response?.data?.error?.message || 'Failed to fetch portfolios'
      const uiStore = useUIStore()
      uiStore.showError('Error', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const fetchPortfolio = async (id: string, includeAnalytics = false): Promise<Portfolio | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioAPI.getPortfolio({
        id,
        includeAssets: true,
        includePerformance: true,
        includeAnalytics
      })

      // Check if response is wrapped in success object or direct data
      let portfolio = null
      if (response.success && response.data) {
        portfolio = response.data
      } else if (response.id) {
        // Direct portfolio data
        portfolio = response
      }

      if (portfolio) {

        
        // Verificar se o total cost está correto
        if (portfolio.assets && portfolio.assets.length > 0) {
          const calculatedTotalCost = portfolio.assets.reduce((sum: number, asset: any) => {
            return sum + Number(asset.totalCost || 0)
          }, 0)
          
          if (Math.abs(Number(portfolio.totalCost) - calculatedTotalCost) > 0.01) {
            console.warn('⚠️ Inconsistência detectada no Total Cost!')
          }
        }
        
        // Convert numeric fields to ensure they are numbers
        const convertedPortfolio = {
          ...portfolio,
          totalValue: Number(portfolio.totalValue) || 0,
          totalCost: Number(portfolio.totalCost) || 0,
          dayChange: Number(portfolio.dayChange) || 0,
          dayChangePercent: Number(portfolio.dayChangePercent) || 0,
          assets: portfolio.assets?.map((asset: any) => ({
              ...asset,
              quantity: Number(asset.quantity) || 0,
              totalCost: Number(asset.totalCost) || 0,
              averageCost: Number(asset.averageCost) || 0,
              dayChange: Number(asset.dayChange) || 0,
              dayChangePercent: Number(asset.dayChangePercent) || 0,
            }))
        }

        // Update portfolio in list
        const index = portfolios.value.findIndex(p => p.id === id)
        if (index >= 0) {
          portfolios.value[index] = convertedPortfolio
        } else {
          portfolios.value.push(convertedPortfolio)
        }

        return convertedPortfolio
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch portfolio'
      const uiStore = useUIStore()
      uiStore.showError('Error', error.value)
    } finally {
      isLoading.value = false
    }

    return null
  }

  const createPortfolio = async (portfolioData: CreatePortfolioRequest): Promise<Portfolio | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioAPI.createPortfolio(portfolioData)

      // Check if response is wrapped in success object or direct data
      let newPortfolio = null
      if (response.success && response.data) {
        newPortfolio = response.data
      } else if (response.id) {
        newPortfolio = response
      }

      if (newPortfolio) {
        // Convert numeric fields to ensure they are numbers
        const convertedPortfolio = {
          ...newPortfolio,
          totalValue: Number(newPortfolio.totalValue) || 0,
          totalCost: Number(newPortfolio.totalCost) || 0,
          dayChange: Number(newPortfolio.dayChange) || 0,
          dayChangePercent: Number(newPortfolio.dayChangePercent) || 0,
          assets: newPortfolio.assets?.map((asset: any) => ({
            ...asset,
            dayChange: Number(asset.dayChange) || 0,
            dayChangePercent: Number(asset.dayChangePercent) || 0,
          })) || []
        }

        portfolios.value.unshift(convertedPortfolio)

        const uiStore = useUIStore()
        uiStore.showSuccess('Portfolio Created', `Portfolio "${convertedPortfolio.name}" has been created successfully`)

        return convertedPortfolio
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create portfolio'
      const uiStore = useUIStore()
      uiStore.showError('Creation Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return null
  }

  const updatePortfolio = async (id: string, portfolioData: UpdatePortfolioRequest): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioAPI.updatePortfolio(id, portfolioData)

      // Check if response is wrapped in success object or direct data
      let updatedPortfolio = null
      if (response.success && response.data) {
        updatedPortfolio = response.data
      } else if (response.id) {
        updatedPortfolio = response
      }

      if (updatedPortfolio) {
        // Convert numeric fields to ensure they are numbers
        const convertedPortfolio = {
          ...updatedPortfolio,
          totalValue: Number(updatedPortfolio.totalValue) || 0,
          totalCost: Number(updatedPortfolio.totalCost) || 0,
          dayChange: Number(updatedPortfolio.dayChange) || 0,
          dayChangePercent: Number(updatedPortfolio.dayChangePercent) || 0,
          assets: updatedPortfolio.assets?.map((asset: any) => ({
            ...asset,
            dayChange: Number(asset.dayChange) || 0,
            dayChangePercent: Number(asset.dayChangePercent) || 0,
          })) || []
        }

        // Update portfolio in list
        const index = portfolios.value.findIndex(p => p.id === id)
        if (index >= 0) {
          portfolios.value[index] = convertedPortfolio
        }

        // Update current portfolio if it's the same
        if (currentPortfolio.value?.id === id) {
          currentPortfolio.value = convertedPortfolio
        }

        const uiStore = useUIStore()
        uiStore.showSuccess('Portfolio Updated', 'Portfolio has been updated successfully')

        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update portfolio'
      const uiStore = useUIStore()
      uiStore.showError('Update Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return false
  }

  const deletePortfolio = async (id: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await portfolioAPI.deletePortfolio(id)

      // For delete operations, we just check if the response indicates success
      const success = response.success !== false && !response.error
      
      if (success) {
        // Remove portfolio from list
        const index = portfolios.value.findIndex(p => p.id === id)
        if (index >= 0) {
          const deletedPortfolio = portfolios.value.splice(index, 1)[0]
          
          // Clear current portfolio if it's the deleted one
          if (currentPortfolio.value?.id === id) {
            currentPortfolio.value = null
          }

          const uiStore = useUIStore()
          uiStore.showSuccess('Portfolio Deleted', `Portfolio "${deletedPortfolio.name}" has been deleted`)
        }

        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to delete portfolio'
      const uiStore = useUIStore()
      uiStore.showError('Deletion Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return false
  }

  const addAsset = async (portfolioId: string, assetData: AddAssetRequest): Promise<boolean> => {
    
    isLoading.value = true
    error.value = null

    try {
      const response = await assetAPI.addAsset(portfolioId, assetData)

      // Check if response is wrapped in success object or direct data
      let newAsset = null
      if (response.success && response.data) {
        newAsset = response.data
      } else if (response.id) {
        newAsset = response
      } else {
      }

      if (newAsset) {
        
        try {
          // Invalidate specific portfolio cache instead of refreshing all
          await invalidatePortfolioCache(portfolioId)
        } catch (cacheError) {
          console.error('❌ STORE: Cache invalidation failed:', cacheError)
          // Don't fail the whole operation if cache invalidation fails
        }

        return true
      } else {
        console.error('❌ STORE: No valid asset data in response')
        return false
      }
    } catch (err: any) {
      console.error('💥 STORE: Add asset error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers,
        message: err.message
      })
      
      error.value = err.response?.data?.error?.message || err.message || 'Failed to add asset'
      const uiStore = useUIStore()
      uiStore.showError('Addition Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return false
  }

  const updateAsset = async (portfolioId: string, assetId: string, assetData: Partial<Asset>): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await assetAPI.updateAsset(portfolioId, assetId, assetData)

      if (response.success) {
        const updatedAsset = response.data
        
        // Force refresh all data to ensure consistency
        await forceRefreshAll()

        const uiStore = useUIStore()
        uiStore.showSuccess('Asset Updated', 'Asset has been updated successfully')

        return true
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to update asset'
      const uiStore = useUIStore()
      uiStore.showError('Update Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return false
  }

  const removeAsset = async (portfolioId: string, assetId: string): Promise<boolean> => {
    isLoading.value = true
    error.value = null

    try {
      // Get asset symbol before removal for success message
      const portfolio = portfolios.value.find(p => p.id === portfolioId)
      const assetToRemove = portfolio?.assets.find(a => a.id === assetId)
      const assetSymbol = assetToRemove?.symbol || 'Asset'


      const response = await assetAPI.removeAsset(portfolioId, assetId)

      // DELETE endpoints return 204 No Content (no body), so we check if response exists
      // If no error was thrown, the deletion was successful
      
      // Force refresh all data to ensure consistency
      await forceRefreshAll()

      const uiStore = useUIStore()
      uiStore.showSuccess('Asset Removed', `${assetSymbol} has been removed from your portfolio`)

      return true
    } catch (err: any) {
      console.error('💥 Remove asset error:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      })
      
      error.value = err.response?.data?.error?.message || 'Failed to remove asset'
      const uiStore = useUIStore()
      uiStore.showError('Removal Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return false
  }

  const fetchTransactions = async (
    portfolioId?: string, 
    assetId?: string,
    transactionType?: string,
    startDate?: string,
    endDate?: string,
    page: number = 1,
    limit: number = 100
  ): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const params: any = {
        page,
        limit
      }
      
      if (portfolioId) params.portfolio_id = portfolioId
      if (assetId) params.asset_id = assetId
      if (transactionType) params.transaction_type = transactionType
      if (startDate) params.start_date = startDate
      if (endDate) params.end_date = endDate

      const response = await transactionAPI.getTransactions(params)

      if (response.success) {
        transactions.value = response.data
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to fetch transactions'
      const uiStore = useUIStore()
      uiStore.showError('Error', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const createTransaction = async (transactionData: CreateTransactionRequest): Promise<Transaction | null> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await transactionAPI.createTransaction(transactionData)

      if (response.success) {
        const newTransaction = response.data
        transactions.value.unshift(newTransaction)

        const uiStore = useUIStore()
        uiStore.showSuccess('Transaction Recorded', 'Transaction has been recorded successfully')

        return newTransaction
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to create transaction'
      const uiStore = useUIStore()
      uiStore.showError('Transaction Failed', error.value)
    } finally {
      isLoading.value = false
    }

    return null
  }

  // Filter actions
  const setPortfolioFilters = (filters: Partial<PortfolioFilters>): void => {
    portfolioFilters.value = { ...portfolioFilters.value, ...filters }
  }

  const setAssetFilters = (filters: Partial<AssetFilters>): void => {
    assetFilters.value = { ...assetFilters.value, ...filters }
  }

  const clearPortfolioFilters = (): void => {
    portfolioFilters.value = {
      search: '',
      sortBy: 'name',
      sortOrder: 'asc'
    }
  }

  const clearAssetFilters = (): void => {
    assetFilters.value = {
      search: '',
      sortBy: 'marketValue',
      sortOrder: 'desc'
    }
  }

  // Utility actions
  const setCurrentPortfolio = (portfolio: Portfolio | null): void => {
    currentPortfolio.value = portfolio
  }

  const clearError = (): void => {
    error.value = null
  }

  const refreshPortfolioData = async (portfolioId?: string): Promise<void> => {
    if (portfolioId) {
      await fetchPortfolio(portfolioId)
    } else {
      await fetchPortfolios()
    }
  }

  return {
    // State
    portfolios: readonly(portfolios),
    currentPortfolio: readonly(currentPortfolio),
    transactions: readonly(transactions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    portfolioFilters: readonly(portfolioFilters),
    assetFilters: readonly(assetFilters),

    // Getters
    totalPortfolioValue,
    totalDayChange,
    totalDayChangePercent,
    filteredPortfolios,
    currentPortfolioAssets,
    portfolioById,
    assetById,

    // Portfolio actions
    fetchPortfolios,
    fetchPortfolio,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,

    // Asset actions
    addAsset,
    updateAsset,
    removeAsset,

    // Transaction actions
    fetchTransactions,
    createTransaction,

    // Filter actions
    setPortfolioFilters,
    setAssetFilters,
    clearPortfolioFilters,
    clearAssetFilters,

    // Utility actions
    setCurrentPortfolio,
    clearError,
    refreshPortfolioData,
    
    // Cache invalidation utilities
    invalidatePortfolioCache,
    invalidateAllPortfoliosCache,
    refreshRecentActivities,
    forceRefreshAll
  }
})