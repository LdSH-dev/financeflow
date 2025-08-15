/**
 * Tests for authentication store
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@stores/auth'
import { localStorageMock } from '../setup'

// Mock the API
vi.mock('@utils/api', () => ({
  authAPI: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  }
}))

describe('Auth Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const authStore = useAuthStore()
      
      expect(authStore.user).toBeNull()
      expect(authStore.tokens.accessToken).toBeNull()
      expect(authStore.tokens.refreshToken).toBeNull()
      expect(authStore.tokens.expiresIn).toBeNull()
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBeNull()
    })

    it('should compute isAuthenticated correctly', () => {
      const authStore = useAuthStore()
      
      expect(authStore.isAuthenticated).toBe(false)
      
      // Mock authenticated state
      authStore.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        preferences: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            portfolioAlerts: true,
            marketNews: false,
            performanceReports: true
          },
          riskTolerance: 'moderate'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isActive: true,
        isVerified: true
      }
      authStore.tokens.accessToken = 'mock-token'
      
      expect(authStore.isAuthenticated).toBe(true)
    })

    it('should compute user initials correctly', () => {
      const authStore = useAuthStore()
      
      expect(authStore.userInitials).toBe('')
      
      authStore.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        preferences: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            portfolioAlerts: true,
            marketNews: false,
            performanceReports: true
          },
          riskTolerance: 'moderate'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isActive: true,
        isVerified: true
      }
      
      expect(authStore.userInitials).toBe('JD')
    })

    it('should compute user full name correctly', () => {
      const authStore = useAuthStore()
      
      expect(authStore.userFullName).toBe('')
      
      authStore.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        preferences: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            portfolioAlerts: true,
            marketNews: false,
            performanceReports: true
          },
          riskTolerance: 'moderate'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isActive: true,
        isVerified: true
      }
      
      expect(authStore.userFullName).toBe('John Doe')
    })
  })

  describe('login', () => {
    it('should handle successful login', async () => {
      const authStore = useAuthStore()
      const { authAPI } = await import('@utils/api')
      
      const mockResponse = {
        success: true,
        data: {
          user: {
            id: '1',
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            isActive: true,
            isVerified: true
          },
          tokens: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
            expiresIn: 3600
          }
        }
      }
      
      vi.mocked(authAPI.login).mockResolvedValue(mockResponse)
      
      await authStore.login({
        email: 'test@example.com',
        password: 'password123',
        remember_me: false
      })
      
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBeNull()
      expect(authStore.user).toBeDefined()
      expect(authStore.tokens.accessToken).toBe('mock-access-token')
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'accessToken',
        'mock-access-token'
      )
    })

    it('should handle login failure', async () => {
      const authStore = useAuthStore()
      const { authAPI } = await import('@utils/api')
      
      const mockError = {
        response: {
          data: {
            error: {
              message: 'Invalid credentials'
            }
          }
        }
      }
      
      vi.mocked(authAPI.login).mockRejectedValue(mockError)
      
      await expect(authStore.login({
        email: 'test@example.com',
        password: 'wrong-password',
        remember_me: false
      })).rejects.toThrow()
      
      expect(authStore.isLoading).toBe(false)
      expect(authStore.error).toBe('Invalid credentials')
      expect(authStore.user).toBeNull()
    })
  })

  describe('logout', () => {
    it('should clear user data and tokens', async () => {
      const authStore = useAuthStore()
      const { authAPI } = await import('@utils/api')
      
      // Set up initial authenticated state
      authStore.user = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        preferences: {
          currency: 'USD',
          timezone: 'UTC',
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            portfolioAlerts: true,
            marketNews: false,
            performanceReports: true
          },
          riskTolerance: 'moderate'
        },
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        isActive: true,
        isVerified: true
      }
      authStore.tokens.accessToken = 'mock-token'
      authStore.tokens.refreshToken = 'mock-refresh-token'
      
      vi.mocked(authAPI.logout).mockResolvedValue({ success: true })
      
      await authStore.logout()
      
      expect(authStore.user).toBeNull()
      expect(authStore.tokens.accessToken).toBeNull()
      expect(authStore.tokens.refreshToken).toBeNull()
      expect(authStore.error).toBeNull()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('accessToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('refreshToken')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('user')
    })
  })

  describe('clearError', () => {
    it('should clear error state', () => {
      const authStore = useAuthStore()
      
      authStore.error = 'Some error'
      expect(authStore.error).toBe('Some error')
      
      authStore.clearError()
      expect(authStore.error).toBeNull()
    })
  })
})