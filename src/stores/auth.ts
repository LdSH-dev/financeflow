import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '@types/api'
import { authAPI } from '@utils/api'
import { useUIStore } from './ui'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const tokens = ref<{
    accessToken: string | null
    refreshToken: string | null
    expiresIn: number | null
  }>({
    accessToken: null,
    refreshToken: null,
    expiresIn: null
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!user.value && !!tokens.value.accessToken)
  const userInitials = computed(() => {
    if (!user.value || !user.value.firstName || !user.value.lastName) return ''
    return `${user.value.firstName.charAt(0)}${user.value.lastName.charAt(0)}`.toUpperCase()
  })
    const userFullName = computed(() => {
    if (!user.value || !user.value.firstName || !user.value.lastName) return ''
    return `${user.value.firstName} ${user.value.lastName}`
  })

  // Actions
  const login = async (credentials: LoginRequest): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.login(credentials)
      
      // Backend returns AuthResponse directly, not wrapped in APIResponse
      const authData = response as any
      
      // Store user data (mapping backend field names to frontend names)
      user.value = {
        id: authData.user.id,
        email: authData.user.email,
        firstName: authData.user.first_name,
        lastName: authData.user.last_name,
        avatarUrl: authData.user.avatar_url,
        isActive: authData.user.is_active,
        isVerified: authData.user.is_verified,
        preferences: authData.user.preferences,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at,
        lastLoginAt: authData.user.last_login_at
      }
      tokens.value = {
        accessToken: authData.tokens.access_token,
        refreshToken: authData.tokens.refresh_token,
        expiresIn: authData.tokens.expires_in
      }

        // Store tokens in localStorage for persistence
        localStorage.setItem('accessToken', authData.tokens.access_token)
        localStorage.setItem('refreshToken', authData.tokens.refresh_token)
        localStorage.setItem('user', JSON.stringify(user.value))

        // Set up token refresh timer
        setupTokenRefresh()

        // Show success notification
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Welcome back!',
          message: `Good to see you again, ${user.value.firstName}`
        })
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Login failed'
      
      // Show error notification
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Login Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const register = async (userData: RegisterRequest): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.register(userData)
      
      // Backend returns AuthResponse directly, not wrapped in APIResponse
      const authData = response as any
      
      // Store user data (mapping backend field names to frontend names)
      user.value = {
        id: authData.user.id,
        email: authData.user.email,
        firstName: authData.user.first_name,
        lastName: authData.user.last_name,
        avatarUrl: authData.user.avatar_url,
        isActive: authData.user.is_active,
        isVerified: authData.user.is_verified,
        preferences: authData.user.preferences,
        createdAt: authData.user.created_at,
        updatedAt: authData.user.updated_at,
        lastLoginAt: authData.user.last_login_at
      }
      tokens.value = {
        accessToken: authData.tokens.access_token,
        refreshToken: authData.tokens.refresh_token,
        expiresIn: authData.tokens.expires_in
      }

        // Store tokens in localStorage
        localStorage.setItem('accessToken', authData.tokens.access_token)
        localStorage.setItem('refreshToken', authData.tokens.refresh_token)
        localStorage.setItem('user', JSON.stringify(user.value))

        // Set up token refresh timer
        setupTokenRefresh()

        // Show success notification
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Account Created!',
          message: `Welcome to FinanceFlow, ${user.value.firstName}!`
        })
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Registration failed'
      
      // Show error notification
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Registration Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const logout = async (showNotification: boolean = true): Promise<void> => {
    isLoading.value = true

    try {
      // Call logout API if refresh token exists
      if (tokens.value.refreshToken) {
        await authAPI.logout(tokens.value.refreshToken)
      }
    } catch (err) {
      // Logout should proceed even if API call fails
      console.warn('Logout API call failed:', err)
    } finally {
      // Clear all state
      user.value = null
      tokens.value = {
        accessToken: null,
        refreshToken: null,
        expiresIn: null
      }
      error.value = null

      // Clear localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')

      // Clear token refresh timer
      clearTokenRefreshTimer()

      isLoading.value = false

      // Show logout notification only if requested
      if (showNotification) {
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'info',
          title: 'Logged Out',
          message: 'You have been successfully logged out'
        })
      }

      // Redirect to login (will be handled by router guard)
      // Note: useRouter can only be called within setup() or component context
    }
  }

  const refreshTokens = async (): Promise<boolean> => {
    
    
    if (!tokens.value.refreshToken) {
      
      return false
    }

    try {

      const response = await authAPI.refreshToken({
        refreshToken: tokens.value.refreshToken
      })



      // Backend returns tokens directly for refresh
      const authData = response as any
      
      if (authData.access_token) {
        // Update tokens
        tokens.value = {
          accessToken: authData.access_token,
          refreshToken: authData.refresh_token,
          expiresIn: authData.expires_in
        }

        // Update localStorage
        localStorage.setItem('accessToken', authData.access_token)
        localStorage.setItem('refreshToken', authData.refresh_token)

        // Set up new refresh timer
        setupTokenRefresh()

        return true
      } else {
        return false
      }
    } catch (err) {
      console.error('💥 Token refresh failed:', err)
      // Don't force logout - let the user continue
      // If tokens are truly invalid, API calls will handle it
      return false
    }

    return false
  }

  const forgotPassword = async (email: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.forgotPassword({ email })
      
      if (response.success) {
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Reset Email Sent',
          message: 'Check your email for password reset instructions'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Failed to send reset email'
      
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Reset Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const resetPassword = async (token: string, password: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.resetPassword({
        token,
        password,
        confirmPassword: password
      })
      
      if (response.success) {
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Password Reset',
          message: 'Your password has been successfully reset'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Password reset failed'
      
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Reset Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.updateProfile(profileData)
      
      if (response.success && user.value) {
        // Update user data
        user.value = { ...user.value, ...response.data }
        
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(user.value))

        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Profile Updated',
          message: 'Your profile has been successfully updated'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Profile update failed'
      
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Update Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
        confirmPassword: newPassword
      })
      
      if (response.success) {
        const uiStore = useUIStore()
        uiStore.showNotification({
          type: 'success',
          title: 'Password Changed',
          message: 'Your password has been successfully changed'
        })
      }
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Password change failed'
      
      const uiStore = useUIStore()
      uiStore.showNotification({
        type: 'error',
        title: 'Change Failed',
        message: error.value
      })
      
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const clearAuthState = (): void => {
    user.value = null
    tokens.value = {
      accessToken: null,
      refreshToken: null,
      expiresIn: null
    }
    error.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    clearTokenRefreshTimer()
  }

  const initializeAuth = async (): Promise<void> => {
    
    try {
      // Check for stored tokens
      const storedAccessToken = localStorage.getItem('accessToken')
      const storedRefreshToken = localStorage.getItem('refreshToken')
      const storedUser = localStorage.getItem('user')

    if (storedAccessToken && storedRefreshToken && storedUser) {
      try {
        // Restore state from localStorage
        tokens.value = {
          accessToken: storedAccessToken,
          refreshToken: storedRefreshToken,
          expiresIn: null
        }
        
        const parsedUser = JSON.parse(storedUser)
        user.value = parsedUser

        // Try to refresh tokens to ensure they're valid
        try {
          const refreshSuccess = await refreshTokens()
          
          if (!refreshSuccess) {
            // Don't logout immediately - let the user continue with current session
            // The token will be refreshed on next API call if needed
          } else {
          }
        } catch (refreshError) {
          // Don't clear auth state immediately - let user continue
          // If tokens are truly invalid, they'll be prompted to login on next API call
        }
      } catch (err) {
        console.error('💥 Auth initialization failed:', err)
        clearAuthState()
      }
    } else {
    }
    } catch (initError) {
      console.error('💥 Critical auth initialization error:', initError)
      clearAuthState()
    }
  }

  const hasPermissions = (permissions: string[]): boolean => {
    // Implement permission checking logic
    // For now, return true for authenticated users
    return isAuthenticated.value
  }

  // Token refresh timer
  let refreshTimer: number | null = null

  const setupTokenRefresh = (): void => {
    clearTokenRefreshTimer()
    
    if (tokens.value.expiresIn) {
      // Refresh token 5 minutes before expiration
      const refreshTime = (tokens.value.expiresIn - 300) * 1000
      
      refreshTimer = window.setTimeout(() => {
        refreshTokens()
      }, refreshTime)
    }
  }

  const clearTokenRefreshTimer = (): void => {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      refreshTimer = null
    }
  }

  const clearError = (): void => {
    error.value = null
  }

  return {
    // State
    user: readonly(user),
    tokens: readonly(tokens),
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Getters
    isAuthenticated,
    userInitials,
    userFullName,
    
    // Actions
    login,
    register,
    logout,
    refreshTokens,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    initializeAuth,
    hasPermissions,
    clearError,
    clearAuthState
  }
}, {
  persist: {
    storage: localStorage,
    paths: ['user', 'tokens']
  }
})