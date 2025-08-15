/**
 * API Types and Interfaces
 * Comprehensive type definitions for API communication
 */

// Base API Response Types
export interface APIResponse<T = unknown> {
  data: T
  success: boolean
  message?: string
  timestamp: string
}

export interface PaginatedResponse<T = unknown> {
  data: T[]
  pagination: PaginationMeta
  success: boolean
  message?: string
  timestamp: string
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

// Authentication Types
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  acceptTerms: boolean
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatarUrl?: string
  }
  tokens: {
    accessToken: string
    refreshToken: string
    expiresIn: number
  }
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  password: string
  confirmPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// User Profile Types
export interface UpdateProfileRequest {
  firstName?: string
  lastName?: string
  avatarUrl?: string
  preferences?: {
    currency?: string
    timezone?: string
    theme?: 'light' | 'dark' | 'system'
    notifications?: {
      email?: boolean
      push?: boolean
      portfolioAlerts?: boolean
      marketNews?: boolean
      performanceReports?: boolean
    }
  }
}

// Market Data API Types
export interface MarketDataRequest {
  symbols: string[]
  fields?: MarketDataField[]
}

export type MarketDataField = 
  | 'price' 
  | 'change' 
  | 'volume' 
  | 'marketCap' 
  | 'peRatio' 
  | 'dividendYield'

export interface HistoricalDataRequest {
  symbol: string
  period: HistoricalPeriod
  interval: HistoricalInterval
  startDate?: string
  endDate?: string
}

export type HistoricalPeriod = 
  | '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'max'

export type HistoricalInterval = 
  | '1m' | '5m' | '15m' | '30m' | '1h' | '1d' | '1wk' | '1mo'

export interface SearchSymbolsRequest {
  query: string
  type?: 'stock' | 'etf' | 'bond' | 'crypto'
  limit?: number
}

export interface SymbolSearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
  currency: string
  country: string
  sector?: string
  industry?: string
}

// Portfolio API Types
export interface PortfolioListRequest extends PaginationParams {
  includeAssets?: boolean
  includePerformance?: boolean
}

export interface PortfolioDetailRequest {
  id: string
  includeAssets?: boolean
  includePerformance?: boolean
  includeAnalytics?: boolean
}

export interface PortfolioAnalyticsRequest {
  portfolioId: string
  period?: HistoricalPeriod
  benchmark?: string
  includeRiskMetrics?: boolean
  includeDiversificationMetrics?: boolean
}

// Asset API Types
export interface AssetListRequest extends PaginationParams {
  portfolioId: string
  assetType?: string[]
  sector?: string[]
  minWeight?: number
  maxWeight?: number
}

export interface BulkAssetUpdateRequest {
  portfolioId: string
  updates: {
    assetId: string
    quantity?: number
    notes?: string
  }[]
}

// Transaction API Types
export interface TransactionListRequest extends PaginationParams {
  portfolioId?: string
  assetId?: string
  type?: string[]
  startDate?: string
  endDate?: string
}

export interface BulkTransactionRequest {
  portfolioId: string
  transactions: {
    symbol: string
    type: 'buy' | 'sell' | 'dividend'
    quantity: number
    price: number
    fees?: number
    date?: string
    notes?: string
  }[]
}

export interface TransactionImportRequest {
  portfolioId: string
  format: 'csv' | 'json'
  data: string | File
  mapping?: Record<string, string>
}

// Alert API Types
export interface AlertListRequest extends PaginationParams {
  portfolioId?: string
  isActive?: boolean
  isTriggered?: boolean
  type?: string[]
}

export interface CreateAlertRequest {
  portfolioId?: string
  symbol?: string
  type: 'price_above' | 'price_below' | 'percent_change' | 'portfolio_value'
  condition: {
    operator: 'greater_than' | 'less_than' | 'equals'
    value: number
    period?: string
  }
  message?: string
}

// News and Analysis API Types
export interface NewsRequest {
  symbols?: string[]
  categories?: NewsCategory[]
  limit?: number
  offset?: number
  startDate?: string
  endDate?: string
}

export type NewsCategory = 
  | 'earnings' 
  | 'dividends' 
  | 'splits' 
  | 'mergers' 
  | 'ratings' 
  | 'general'

export interface NewsArticle {
  id: string
  title: string
  summary: string
  url: string
  source: string
  publishedAt: string
  symbols: string[]
  categories: NewsCategory[]
  sentiment?: 'positive' | 'negative' | 'neutral'
}

// Reports API Types
export interface ReportGenerationRequest {
  portfolioId: string
  type: ReportType
  period: HistoricalPeriod
  format: 'pdf' | 'excel' | 'csv'
  options?: ReportOptions
}

export type ReportType = 
  | 'performance' 
  | 'holdings' 
  | 'transactions' 
  | 'tax_summary' 
  | 'risk_analysis'

export interface ReportOptions {
  includeCharts?: boolean
  includeBenchmark?: boolean
  benchmark?: string
  customDateRange?: {
    startDate: string
    endDate: string
  }
}

export interface ReportStatus {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  downloadUrl?: string
  error?: string
  createdAt: string
  completedAt?: string
}

// WebSocket API Types
export interface WebSocketMessage<T = unknown> {
  type: WebSocketMessageType
  data: T
  timestamp: string
  requestId?: string
}

export type WebSocketMessageType = 
  | 'price_update' 
  | 'portfolio_update' 
  | 'alert_triggered' 
  | 'news_update' 
  | 'connection_status'
  | 'error'

export interface WebSocketSubscription {
  type: 'portfolio' | 'symbols' | 'news'
  targets: string[]
}

export interface PriceUpdateMessage {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  timestamp: string
}

export interface PortfolioUpdateMessage {
  portfolioId: string
  totalValue: number
  dayChange: number
  dayChangePercent: number
  updatedAssets: {
    symbol: string
    price: number
    marketValue: number
  }[]
  timestamp: string
}

// File Upload Types
export interface FileUploadRequest {
  file: File
  type: 'avatar' | 'document' | 'import'
  portfolioId?: string
}

export interface FileUploadResponse {
  fileId: string
  filename: string
  url: string
  size: number
  mimeType: string
  uploadedAt: string
}

// Backup and Export Types
export interface ExportRequest {
  portfolioIds?: string[]
  format: 'json' | 'csv' | 'excel'
  includeTransactions?: boolean
  includePerformance?: boolean
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export interface ImportRequest {
  file: File
  format: 'json' | 'csv' | 'excel'
  options: {
    createPortfolios?: boolean
    mergeAssets?: boolean
    skipDuplicates?: boolean
  }
}

// Error Response Types
export interface APIErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
    field?: string
  }
  timestamp: string
}

export interface ValidationError {
  field: string
  message: string
  code: string
  value?: unknown
}

export interface ValidationErrorResponse extends APIErrorResponse {
  error: {
    code: 'VALIDATION_ERROR'
    message: string
    details: {
      errors: ValidationError[]
    }
  }
}

// Rate Limiting Types
export interface RateLimitInfo {
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

// API Configuration Types
export interface APIConfig {
  baseURL: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  rateLimitEnabled: boolean
  apiVersion: string
}

// Request/Response Interceptor Types
export interface RequestInterceptor {
  onRequest?: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>
  onError?: (error: unknown) => unknown | Promise<unknown>
}

export interface ResponseInterceptor {
  onResponse?: (response: APIResponse) => APIResponse | Promise<APIResponse>
  onError?: (error: unknown) => unknown | Promise<unknown>
}

export interface RequestConfig {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, unknown>
  data?: unknown
  timeout?: number
  retries?: number
}

// Cache Types
export interface CacheConfig {
  enabled: boolean
  ttl: number // Time to live in seconds
  maxSize: number
  strategy: 'memory' | 'localStorage' | 'sessionStorage'
}

export interface CacheEntry<T = unknown> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

// Health Check Types
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  services: {
    database: ServiceStatus
    cache: ServiceStatus
    marketData: ServiceStatus
    notifications: ServiceStatus
  }
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy'
  responseTime: number
  lastCheck: string
  error?: string
}