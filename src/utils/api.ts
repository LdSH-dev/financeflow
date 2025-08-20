/**
 * API Client Module
 * Centralized API communication layer with authentication, error handling, and caching
 */

import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'
import type { 
  APIResponse, 
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  UpdateProfileRequest,
  PortfolioListRequest,
  PortfolioDetailRequest,
  CreatePortfolioRequest,
  UpdatePortfolioRequest,
  AddAssetRequest,
  CreateTransactionRequest,
  TransactionListRequest,
  MarketDataRequest,
  HistoricalDataRequest,
  SearchSymbolsRequest
} from '@types/api'
import type { Portfolio, Asset, Transaction, User, MarketData, HistoricalPrice } from '@types/portfolio'

// API Configuration
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
}

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for authentication
apiClient.interceptors.request.use(
  (config) => {
      // Add auth token from localStorage
  const token = localStorage.getItem('accessToken')
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
    
    // Add request timestamp
    config.headers['X-Request-Time'] = new Date().toISOString()
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    console.error('❌ API Response error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    const originalRequest = error.config
    
    // Handle token refresh on 401 errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken && refreshToken.trim() !== '') {
        try {

          const response = await authAPI.refreshToken({ refresh_token: refreshToken })
          
          // Backend returns tokens directly, not wrapped in success/data structure
          if (response.access_token) {
            const newToken = response.access_token
            localStorage.setItem('accessToken', newToken)
            localStorage.setItem('refreshToken', response.refresh_token)
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return apiClient(originalRequest)
          }
        } catch (refreshError: any) {
          console.error('💥 Token refresh failed:', {
            status: refreshError.response?.status,
            data: refreshError.response?.data,
            message: refreshError.message
          })
          
          // Refresh failed, clear tokens and redirect to login
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          window.location.href = '/login'
        }
      } else {
        console.warn('⚠️ No valid refresh token found, redirecting to login')
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

// Generic API methods
const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.get<APIResponse<T>>(url, config).then(res => res.data),
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.post<APIResponse<T>>(url, data, config).then(res => res.data),
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.put<APIResponse<T>>(url, data, config).then(res => res.data),
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig) => 
    apiClient.patch<APIResponse<T>>(url, data, config).then(res => res.data),
    
  delete: <T>(url: string, config?: AxiosRequestConfig) => 
    apiClient.delete<APIResponse<T>>(url, config).then(res => res.data)
}

// Authentication API
export const authAPI = {
  login: (credentials: LoginRequest) => 
    apiClient.post('/auth/login', credentials).then(res => res.data),
    
  register: (userData: RegisterRequest) => 
    apiClient.post('/auth/register', userData).then(res => res.data),
    
  logout: (refreshToken: string) => 
    apiClient.post('/auth/logout', { refreshToken }).then(res => res.data),
    
  refreshToken: (data: RefreshTokenRequest) => 
    apiClient.post('/auth/refresh', data).then(res => res.data),
    
  forgotPassword: (data: ForgotPasswordRequest) => 
    api.post('/auth/forgot-password', data),
    
  resetPassword: (data: ResetPasswordRequest) => 
    api.post('/auth/reset-password', data),
    
  changePassword: (data: ChangePasswordRequest) => 
    api.patch('/auth/change-password', data),
    
  updateProfile: (data: UpdateProfileRequest) => 
    api.patch<User>('/auth/profile', data),
    
  getProfile: () => 
    api.get<User>('/auth/profile')
}

// Portfolio API
export const portfolioAPI = {
  getPortfolios: (params?: PortfolioListRequest) => 
    api.get<Portfolio[]>('/portfolios', { 
      params: params ? {
        include_assets: params.includeAssets,
        include_performance: params.includePerformance
      } : undefined
    }),
    
  getPortfolio: (params: PortfolioDetailRequest) => 
    api.get<Portfolio>(`/portfolios/${params.id}`, { 
      params: { 
        include_assets: params.includeAssets,
        include_performance: params.includePerformance,
        include_analytics: params.includeAnalytics
      }
    }),
    
  createPortfolio: (data: CreatePortfolioRequest) => 
    api.post<Portfolio>('/portfolios', data),
    
  updatePortfolio: (id: string, data: UpdatePortfolioRequest) => 
    api.patch<Portfolio>(`/portfolios/${id}`, data),
    
  deletePortfolio: (id: string) => 
    api.delete(`/portfolios/${id}`),
    
  getPortfolioAnalytics: (portfolioId: string, params?: any) => 
    api.get(`/portfolios/${portfolioId}/analytics`, { params }),
    
  rebalancePortfolio: (portfolioId: string, targetAllocation?: any) => 
    api.post(`/portfolios/${portfolioId}/rebalance`, { targetAllocation }),
    
  getRecentActivities: (limit?: number) => 
    api.get<any[]>('/portfolios/recent-activities', { params: { limit } })
}

// Asset API
export const assetAPI = {
  getAssets: (portfolioId: string, params?: any) => 
    api.get<Asset[]>(`/portfolios/${portfolioId}/assets`, { params }),
    
  getAsset: (portfolioId: string, assetId: string) => 
    api.get<Asset>(`/portfolios/${portfolioId}/assets/${assetId}`),
    
  addAsset: (portfolioId: string, data: AddAssetRequest) => 
    api.post<Asset>(`/portfolios/${portfolioId}/assets`, data),
    
  updateAsset: (portfolioId: string, assetId: string, data: Partial<Asset>) => 
    api.patch<Asset>(`/portfolios/${portfolioId}/assets/${assetId}`, data),
    
  removeAsset: (portfolioId: string, assetId: string) => 
    api.delete(`/portfolios/${portfolioId}/assets/${assetId}`),
    
  bulkUpdateAssets: (portfolioId: string, updates: any[]) => 
    api.patch(`/portfolios/${portfolioId}/assets/bulk`, { updates })
}

// Transaction API
export const transactionAPI = {
  getTransactions: (params?: any) => 
    api.get<Transaction[]>('/transactions', { params }),
    
  getTransaction: (id: string) => 
    api.get<Transaction>(`/transactions/${id}`),
    
  createTransaction: (data: CreateTransactionRequest) => 
    api.post<Transaction>('/transactions', data),
    
  updateTransaction: (id: string, data: Partial<Transaction>) => 
    api.patch<Transaction>(`/transactions/${id}`, data),
    
  deleteTransaction: (id: string) => 
    api.delete(`/transactions/${id}`),
    
  bulkCreateTransactions: (data: CreateTransactionRequest[]) => 
    api.post('/transactions/bulk', data),
    
  getTransactionSummary: (params?: any) => 
    api.get('/transactions/summary/stats', { params })
}

// Market Data API
export const marketDataAPI = {
  getQuotes: (symbols: string[]) => 
    api.post<MarketData[]>('/market-data/quotes', { symbols }),
    
  getHistoricalData: (params: HistoricalDataRequest) => 
    api.get<HistoricalPrice[]>('/market-data/historical', { params }),
    
  searchSymbols: (params: SearchSymbolsRequest) => 
    api.get('/market-data/search', { params }),
    
  getMarketSummary: () => 
    api.get('/market-data/summary'),
    
  getTopMovers: (type: 'gainers' | 'losers' | 'active') => 
    api.get(`/market-data/movers/${type}`),
    
  getNewsFeed: (symbols?: string[], limit = 20) => 
    api.get('/market-data/news', { params: { symbols, limit } })
}

// Watchlist API
export const watchlistAPI = {
  getWatchlist: () => 
    api.get('/watchlist'),
    
  addToWatchlist: (symbol: string) => 
    api.post('/watchlist', { symbol }),
    
  removeFromWatchlist: (symbol: string) => 
    api.delete(`/watchlist/${symbol}`)
}

// Alerts API
export const alertsAPI = {
  getAlerts: (params?: any) => 
    api.get('/alerts', { params }),
    
  createAlert: (data: any) => 
    api.post('/alerts', data),
    
  updateAlert: (id: string, data: any) => 
    api.patch(`/alerts/${id}`, data),
    
  deleteAlert: (id: string) => 
    api.delete(`/alerts/${id}`),
    
  toggleAlert: (id: string, active: boolean) => 
    api.patch(`/alerts/${id}/toggle`, { active })
}

// Reports API
export const reportsAPI = {
  generateReport: (type: string, portfolioId: string, options?: any) => 
    api.post('/reports/generate', { type, portfolioId, ...options }),
    
  getReportStatus: (reportId: string) => 
    api.get(`/reports/${reportId}/status`),
    
  downloadReport: (reportId: string) => {
    return apiClient.get(`/reports/${reportId}/download`, {
      responseType: 'blob'
    }).then(response => {
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `report-${reportId}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    })
  }
}

// WebSocket API for real-time updates
export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private listeners: Map<string, Set<(data: any) => void>> = new Map()

  constructor(url?: string) {
    this.url = url || `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws`
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = localStorage.getItem('accessToken')
        const wsUrl = token ? `${this.url}?token=${token}` : this.url
        
        this.ws = new WebSocket(wsUrl)
        
        this.ws.onopen = () => {
          this.reconnectAttempts = 0
          resolve()
        }
        
        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)
            this.handleMessage(message)
          } catch (error) {
            console.error('WebSocket message parse error:', error)
          }
        }
        
        this.ws.onclose = () => {
          this.attemptReconnect()
        }
        
        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  subscribe(channel: string, callback: (data: any) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)
    
    // Send subscription message
    this.send({
      type: 'subscribe',
      channel
    })
  }

  unsubscribe(channel: string, callback?: (data: any) => void): void {
    const channelListeners = this.listeners.get(channel)
    if (channelListeners) {
      if (callback) {
        channelListeners.delete(callback)
      } else {
        channelListeners.clear()
      }
      
      if (channelListeners.size === 0) {
        this.listeners.delete(channel)
        // Send unsubscription message
        this.send({
          type: 'unsubscribe',
          channel
        })
      }
    }
  }

  private send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data))
    }
  }

  private handleMessage(message: any): void {
    const { type, channel, data } = message
    
    if (type === 'data' && channel) {
      const channelListeners = this.listeners.get(channel)
      if (channelListeners) {
        channelListeners.forEach(callback => callback(data))
      }
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
      
      setTimeout(() => {
        this.connect().catch(() => {
          // Will retry on next attempt
        })
      }, delay)
    }
  }
}

// Global WebSocket instance
export const wsClient = new WebSocketClient()

// Health check API
export const healthAPI = {
  getHealth: () => api.get('/health'),
  getStatus: () => api.get('/status')
}

// Export the main API client for advanced usage
export { apiClient }

// Default export
export default {
  auth: authAPI,
  portfolio: portfolioAPI,
  asset: assetAPI,
  transaction: transactionAPI,
  marketData: marketDataAPI,
  watchlist: watchlistAPI,
  alerts: alertsAPI,
  reports: reportsAPI,
  health: healthAPI,
  ws: wsClient
}