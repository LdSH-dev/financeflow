import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  persistent?: boolean
  actions?: NotificationAction[]
}

export interface NotificationAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary'
}

export interface ConfirmationModal {
  show: boolean
  title: string
  message: string
  type: 'warning' | 'danger' | 'info'
  loading: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => Promise<void> | void
  onCancel?: () => Promise<void> | void
}

export interface SettingsModal {
  show: boolean
  activeTab?: string
}

export const useUIStore = defineStore('ui', () => {
  // State
  const theme = ref<'light' | 'dark' | 'system'>('system')
  const sidebarCollapsed = ref(false)
  const loading = ref(false)
  const notifications = ref<Notification[]>([])
  const breadcrumb = ref<string[]>([])
  
  // Modal states
  const confirmationModal = ref<ConfirmationModal>({
    show: false,
    title: '',
    message: '',
    type: 'warning',
    loading: false
  })
  
  const settingsModal = ref<SettingsModal>({
    show: false,
    activeTab: 'general'
  })

  // Getters
  const isDarkMode = computed(() => {
    if (theme.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return theme.value === 'dark'
  })

  const activeNotifications = computed(() => {
    return notifications.value.filter(n => !n.persistent || n.duration)
  })

  const persistentNotifications = computed(() => {
    return notifications.value.filter(n => n.persistent && !n.duration)
  })

  // Actions
  const setTheme = (newTheme: 'light' | 'dark' | 'system'): void => {
    theme.value = newTheme
    localStorage.setItem('theme', newTheme)
    applyTheme()
  }

  const initializeTheme = (): void => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) {
      theme.value = savedTheme
    }
    
    applyTheme()
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (theme.value === 'system') {
        applyTheme()
      }
    })
  }

  const applyTheme = (): void => {
    const htmlElement = document.documentElement
    
    if (isDarkMode.value) {
      htmlElement.classList.add('dark')
    } else {
      htmlElement.classList.remove('dark')
    }
  }

  const toggleSidebar = (): void => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed.value))
  }

  const setSidebarCollapsed = (collapsed: boolean): void => {
    sidebarCollapsed.value = collapsed
    localStorage.setItem('sidebarCollapsed', String(collapsed))
  }

  const initializeSidebar = (): void => {
    const savedState = localStorage.getItem('sidebarCollapsed')
    if (savedState !== null) {
      sidebarCollapsed.value = savedState === 'true'
    }
  }

  const setLoading = (isLoading: boolean): void => {
    loading.value = isLoading
  }

  const showNotification = (notification: Omit<Notification, 'id'>): string => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newNotification: Notification = {
      id,
      duration: 5000, // Default 5 seconds
      ...notification
    }

    notifications.value.push(newNotification)

    // Auto-remove notification after duration
    if (newNotification.duration && !newNotification.persistent) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string): void => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearAllNotifications = (): void => {
    notifications.value = []
  }

  const showConfirmation = (options: Omit<ConfirmationModal, 'show' | 'loading'>): Promise<boolean> => {
    return new Promise((resolve) => {
      confirmationModal.value = {
        ...options,
        show: true,
        loading: false,
        onConfirm: async () => {
          confirmationModal.value.loading = true
          try {
            if (options.onConfirm) {
              await options.onConfirm()
            }
            resolve(true)
          } catch (error) {
            console.error('Confirmation action failed:', error)
            resolve(false)
          } finally {
            confirmationModal.value.show = false
            confirmationModal.value.loading = false
          }
        },
        onCancel: async () => {
          try {
            if (options.onCancel) {
              await options.onCancel()
            }
            resolve(false)
          } catch (error) {
            console.error('Cancel action failed:', error)
            resolve(false)
          } finally {
            confirmationModal.value.show = false
          }
        }
      }
    })
  }

  const hideConfirmation = (): void => {
    confirmationModal.value.show = false
    confirmationModal.value.loading = false
  }

  const showSettings = (activeTab?: string): void => {
    settingsModal.value = {
      show: true,
      activeTab: activeTab || 'general'
    }
  }

  const hideSettings = (): void => {
    settingsModal.value.show = false
  }

  const setBreadcrumb = (items: string[]): void => {
    breadcrumb.value = items
  }

  const addBreadcrumbItem = (item: string): void => {
    breadcrumb.value.push(item)
  }

  const clearBreadcrumb = (): void => {
    breadcrumb.value = []
  }

  // Keyboard shortcuts
  const handleKeyboardShortcut = (event: KeyboardEvent): void => {
    // Cmd/Ctrl + K for search
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault()
      // Trigger global search
      showNotification({
        type: 'info',
        title: 'Search',
        message: 'Global search functionality coming soon!'
      })
    }

    // Cmd/Ctrl + , for settings
    if ((event.metaKey || event.ctrlKey) && event.key === ',') {
      event.preventDefault()
      showSettings()
    }

    // Escape to close modals
    if (event.key === 'Escape') {
      if (confirmationModal.value.show) {
        hideConfirmation()
      }
      if (settingsModal.value.show) {
        hideSettings()
      }
    }
  }

  // Toast notification helpers
  const showSuccess = (title: string, message: string): string => {
    return showNotification({
      type: 'success',
      title,
      message
    })
  }

  const showError = (title: string, message: string): string => {
    return showNotification({
      type: 'error',
      title,
      message,
      duration: 8000 // Longer duration for errors
    })
  }

  const showWarning = (title: string, message: string): string => {
    return showNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    })
  }

  const showInfo = (title: string, message: string): string => {
    return showNotification({
      type: 'info',
      title,
      message
    })
  }

  // Performance monitoring
  const trackUserAction = (action: string, data?: Record<string, any>): void => {
    // In production, send to analytics service
    if (import.meta.env.DEV) {
      // Debug tracking removed for production
    }
  }

  // Accessibility helpers
  const announceToScreenReader = (message: string): void => {
    const announcement = document.createElement('div')
    announcement.textContent = message
    announcement.setAttribute('aria-live', 'polite')
    announcement.setAttribute('aria-atomic', 'true')
    announcement.style.position = 'absolute'
    announcement.style.left = '-10000px'
    announcement.style.width = '1px'
    announcement.style.height = '1px'
    announcement.style.overflow = 'hidden'

    document.body.appendChild(announcement)

    setTimeout(() => {
      document.body.removeChild(announcement)
    }, 1000)
  }

  // Initialize UI store
  const initialize = (): void => {
    initializeTheme()
    initializeSidebar()
    
    // Set up keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcut)
  }

  // Cleanup
  const cleanup = (): void => {
    document.removeEventListener('keydown', handleKeyboardShortcut)
  }

  return {
    // State
    theme: readonly(theme),
    sidebarCollapsed: readonly(sidebarCollapsed),
    loading: readonly(loading),
    notifications: readonly(notifications),
    breadcrumb: readonly(breadcrumb),
    confirmationModal: readonly(confirmationModal),
    settingsModal: readonly(settingsModal),

    // Getters
    isDarkMode,
    activeNotifications,
    persistentNotifications,

    // Theme actions
    setTheme,
    initializeTheme,
    applyTheme,

    // Sidebar actions
    toggleSidebar,
    setSidebarCollapsed,
    initializeSidebar,

    // Loading actions
    setLoading,

    // Notification actions
    showNotification,
    removeNotification,
    clearAllNotifications,
    showSuccess,
    showError,
    showWarning,
    showInfo,

    // Modal actions
    showConfirmation,
    hideConfirmation,
    showSettings,
    hideSettings,

    // Breadcrumb actions
    setBreadcrumb,
    addBreadcrumbItem,
    clearBreadcrumb,

    // Utility actions
    trackUserAction,
    announceToScreenReader,
    initialize,
    cleanup
  }
}, {
  persist: {
    storage: localStorage,
    paths: ['theme', 'sidebarCollapsed']
  }
})