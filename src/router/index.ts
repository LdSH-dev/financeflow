import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@stores/auth'
import { useUIStore } from '@stores/ui'

// Route components with lazy loading
const DashboardView = () => import('@views/DashboardView.vue')
const LoginView = () => import('@views/auth/LoginView.vue')
const RegisterView = () => import('@views/auth/RegisterView.vue')
const ForgotPasswordView = () => import('@views/auth/ForgotPasswordView.vue')
const ResetPasswordView = () => import('@views/auth/ResetPasswordView.vue')
const PortfolioListView = () => import('@views/portfolio/PortfolioListView.vue')
const PortfolioDetailView = () => import('@views/portfolio/PortfolioDetailView.vue')
const PortfolioCreateView = () => import('@views/portfolio/PortfolioCreateView.vue')
const PortfolioEditView = () => import('@views/portfolio/PortfolioEditView.vue')
const AddAssetView = () => import('@views/portfolio/AddAssetView.vue')
const TransactionsView = () => import('@views/TransactionsView.vue')
const NotFoundView = () => import('@views/NotFoundView.vue')

// Define route metadata interface
declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    requiresGuest?: boolean
    title?: string
    description?: string
    transition?: string
    layout?: string
    breadcrumb?: string[]
    permissions?: string[]
  }
}

// Route definitions
const routes: RouteRecordRaw[] = [
  // Root route that renders the dashboard directly
  {
    path: '/',
    name: 'home',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
      description: 'Portfolio overview and insights',
      breadcrumb: ['Dashboard'],
      transition: 'fade'
    }
  },

  // Authentication routes
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: {
      requiresGuest: true,
      title: 'Sign In',
      description: 'Sign in to your FinanceFlow account',
      layout: 'auth',
      transition: 'slide'
    }
  },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: {
      requiresGuest: true,
      title: 'Create Account',
      description: 'Create your FinanceFlow account',
      layout: 'auth',
      transition: 'slide'
    }
  },
  {
    path: '/forgot-password',
    name: 'forgot-password',
    component: ForgotPasswordView,
    meta: {
      requiresGuest: true,
      title: 'Forgot Password',
      description: 'Reset your password',
      layout: 'auth',
      transition: 'slide'
    }
  },
  {
    path: '/reset-password',
    name: 'reset-password',
    component: ResetPasswordView,
    meta: {
      requiresGuest: true,
      title: 'Reset Password',
      description: 'Create a new password',
      layout: 'auth',
      transition: 'slide'
    }
  },

  // Main application routes
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: {
      requiresAuth: true,
      title: 'Dashboard',
      description: 'Portfolio overview and insights',
      breadcrumb: ['Dashboard'],
      transition: 'fade'
    }
  },

  // Portfolio routes
  {
    path: '/portfolios',
    name: 'portfolios',
    component: PortfolioListView,
    meta: {
      requiresAuth: true,
      title: 'Portfolios',
      description: 'Manage your investment portfolios',
      breadcrumb: ['Portfolios'],
      transition: 'fade'
    }
  },
  {
    path: '/portfolios/create',
    name: 'portfolio-create',
    component: PortfolioCreateView,
    meta: {
      requiresAuth: true,
      title: 'Create Portfolio',
      description: 'Create a new investment portfolio',
      breadcrumb: ['Portfolios', 'Create'],
      transition: 'slide'
    }
  },
  {
    path: '/portfolios/:id',
    name: 'portfolio-detail',
    component: PortfolioDetailView,
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Portfolio Details',
      description: 'View and manage portfolio details',
      breadcrumb: ['Portfolios', 'Details'],
      transition: 'fade'
    }
  },
  {
    path: '/portfolios/:id/edit',
    name: 'portfolio-edit',
    component: PortfolioEditView,
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Edit Portfolio',
      description: 'Edit portfolio information',
      breadcrumb: ['Portfolios', 'Edit'],
      transition: 'slide'
    }
  },
  {
    path: '/portfolios/:id/assets/add',
    name: 'add-asset',
    component: AddAssetView,
    props: true,
    meta: {
      requiresAuth: true,
      title: 'Add Asset',
      description: 'Add a new asset to your portfolio',
      breadcrumb: ['Portfolios', 'Add Asset'],
      transition: 'slide'
    }
  },

  // Transactions route
  {
    path: '/transactions',
    name: 'transactions',
    component: TransactionsView,
    meta: {
      requiresAuth: true,
      title: 'Transactions',
      description: 'View and manage your transactions',
      breadcrumb: ['Transactions'],
      transition: 'fade'
    }
  },

  // 404 route - must be last
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist',
      transition: 'fade'
    }
  }
]

// Create router instance
export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Restore scroll position for back/forward navigation
    if (savedPosition) {
      return savedPosition
    }
    // Scroll to anchor if present
    if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      }
    }
    // Scroll to top for new pages
    return { top: 0, behavior: 'smooth' }
  }
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  const uiStore = useUIStore()

  // Show loading indicator for navigation
  uiStore.setLoading(true)

  try {
    // Check if route requires authentication
    if (to.meta.requiresAuth) {
      // For dashboard, be more lenient - just check if we have any user data
      if (to.name === 'dashboard') {
        // Try to get user from localStorage as fallback
        const storedUser = localStorage.getItem('user')
        if (!authStore.isAuthenticated && !storedUser) {
          next({
            name: 'login',
            query: { redirect: to.fullPath }
          })
          return
        }
      } else if (!authStore.isAuthenticated) {
        // For other protected routes, enforce strict authentication
        next({
          name: 'login',
          query: { redirect: to.fullPath }
        })
        return
      }

      // Check for required permissions
      if (to.meta.permissions && !authStore.hasPermissions(to.meta.permissions)) {
        next({ name: 'dashboard' })
        return
      }
    }

    // Check if route requires guest (not authenticated)
    if (to.meta.requiresGuest && authStore.isAuthenticated) {
      next({ name: 'dashboard' })
      return
    }

    // Proceed with navigation
    next()
  } catch (error) {
    console.error('Navigation error:', error)
    // For dashboard route, be more forgiving
    if (to.name === 'dashboard') {
      next()
    } else {
      next({ name: 'login' })
    }
  }
})

router.afterEach((to, from) => {
  const uiStore = useUIStore()

  // Hide loading indicator
  uiStore.setLoading(false)

  // Update document title
  const baseTitle = 'FinanceFlow'
  document.title = to.meta.title 
    ? `${to.meta.title} | ${baseTitle}`
    : baseTitle

  // Update meta description
  const metaDescription = document.querySelector('meta[name="description"]')
  if (metaDescription && to.meta.description) {
    metaDescription.setAttribute('content', to.meta.description)
  }

  // Track page views for analytics
  if (import.meta.env.PROD && window.gtag) {
    window.gtag('config', 'GA_TRACKING_ID', {
      page_title: to.meta.title,
      page_location: window.location.href,
      page_path: to.path
    })
  }

  // Update breadcrumb
  if (to.meta.breadcrumb) {
    uiStore.setBreadcrumb(to.meta.breadcrumb)
  }
})

// Handle navigation errors
router.onError((error, to, from) => {
  console.error('Router error:', error)
  
  // Navigate to error page or fallback
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    // Handle chunk load errors (usually from deployment updates)
    window.location.reload()
  } else {
    router.push({ name: 'not-found' })
  }
})

export default router