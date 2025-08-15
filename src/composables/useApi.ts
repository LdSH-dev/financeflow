import { ref, computed, readonly } from 'vue'
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'
import type { APIResponse, APIErrorResponse } from '@types/api'

export interface UseApiOptions {
  baseURL?: string
  timeout?: number
  retryAttempts?: number
  retryDelay?: number
}

export function useApi(options: UseApiOptions = {}) {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  // State
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Configuration
  const config = {
    baseURL: options.baseURL || import.meta.env.VITE_API_URL || '/api',
    timeout: options.timeout || 10000,
    retryAttempts: options.retryAttempts || 3,
    retryDelay: options.retryDelay || 1000
  }

  // Create axios instance
  const apiClient: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/json'
    }
  })

  // Request interceptor
  apiClient.interceptors.request.use(
    (requestConfig) => {
      // Add authentication token
      const token = authStore.tokens.accessToken
      if (token) {
        requestConfig.headers.Authorization = `Bearer ${token}`
      }

      // Add request ID for tracing
      requestConfig.headers['X-Request-ID'] = generateRequestId()

      // Log request in development
      if (import.meta.env.DEV) {
        // Request logging removed for production
      }

      return requestConfig
    },
    (error) => {
      console.error('Request interceptor error:', error)
      return Promise.reject(error)
    }
  )

  // Response interceptor
  apiClient.interceptors.response.use(
    (response: AxiosResponse<APIResponse>) => {
      // Log response in development
      if (import.meta.env.DEV) {
        // Response logging removed for production
      }

      return response
    },
    async (error) => {
      const originalRequest = error.config

      // Handle token refresh
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true

        try {
          const refreshSuccess = await authStore.refreshTokens()
          if (refreshSuccess) {
            // Retry original request with new token
            const token = authStore.tokens.accessToken
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return apiClient(originalRequest)
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await authStore.logout()
          return Promise.reject(refreshError)
        }
      }

      // Handle network errors
      if (!error.response) {
        uiStore.showError('Network Error', 'Please check your internet connection')
      }

      // Log error in development
      if (import.meta.env.DEV) {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        })
      }

      return Promise.reject(error)
    }
  )

  // Retry logic for failed requests
  const retryRequest = async (requestConfig: AxiosRequestConfig, attempt = 1): Promise<AxiosResponse> => {
    try {
      return await apiClient(requestConfig)
    } catch (error: any) {
      if (attempt < config.retryAttempts && isRetryableError(error)) {
        await delay(config.retryDelay * attempt)
        return retryRequest(requestConfig, attempt + 1)
      }
      throw error
    }
  }

  // HTTP methods with loading state management
  const get = async <T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<APIResponse<T>> => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest({ ...requestConfig, method: 'GET', url })
      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const post = async <T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<APIResponse<T>> => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest({ ...requestConfig, method: 'POST', url, data })
      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const put = async <T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<APIResponse<T>> => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest({ ...requestConfig, method: 'PUT', url, data })
      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const patch = async <T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<APIResponse<T>> => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest({ ...requestConfig, method: 'PATCH', url, data })
      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const del = async <T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<APIResponse<T>> => {
    loading.value = true
    error.value = null

    try {
      const response = await retryRequest({ ...requestConfig, method: 'DELETE', url })
      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Upload file with progress tracking
  const upload = async (
    url: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<APIResponse> => {
    loading.value = true
    error.value = null

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await apiClient.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        }
      })

      return response.data
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Download file
  const download = async (url: string, filename?: string): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const response = await apiClient.get(url, {
        responseType: 'blob'
      })

      // Create download link
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)
    } catch (err: any) {
      error.value = extractErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Utility functions
  const generateRequestId = (): string => {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const isRetryableError = (error: any): boolean => {
    // Retry on network errors and 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600)
  }

  const extractErrorMessage = (error: any): string => {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message
    }
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    if (error.message) {
      return error.message
    }
    return 'An unexpected error occurred'
  }

  const delay = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const clearError = (): void => {
    error.value = null
  }

  // Computed
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  return {
    // State
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    isLoading,
    hasError,

    // HTTP methods
    get,
    post,
    put,
    patch,
    delete: del,
    upload,
    download,

    // Utilities
    clearError,
    
    // Raw axios instance for advanced use cases
    apiClient
  }
}

// Global API instance
export const useGlobalApi = () => useApi()

// Specialized API hooks
export const useAuthApi = () => useApi({ baseURL: `/auth` })
export const usePortfolioApi = () => useApi({ baseURL: `/portfolios` })
export const useMarketDataApi = () => useApi({ baseURL: `/market-data` })