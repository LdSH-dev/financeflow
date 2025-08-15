/**
 * Portfolio Management Types
 * Comprehensive type definitions for portfolio and asset management
 */

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
  preferences: UserPreferences
}

export interface UserPreferences {
  currency: Currency
  timezone: string
  theme: 'light' | 'dark' | 'system'
  notifications: NotificationSettings
  riskTolerance: RiskTolerance
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  portfolioAlerts: boolean
  marketNews: boolean
  performanceReports: boolean
}

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD'

export interface Portfolio {
  id: string
  userId: string
  name: string
  description: string
  totalValue: number
  totalCost: number
  unrealizedGainLoss: number
  unrealizedGainLossPercent: number
  dayChange: number
  dayChangePercent: number
  currency: Currency
  assets: Asset[]
  allocation: AssetAllocation[]
  performance: PerformanceData
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  portfolioId: string
  symbol: string
  name: string
  assetType: AssetType
  sector?: string
  industry?: string
  quantity: number
  averageCost: number
  currentPrice: number
  marketValue: number
  totalCost: number
  unrealizedGainLoss: number
  unrealizedGainLossPercent: number
  dayChange: number
  dayChangePercent: number
  weight: number // Portfolio weight percentage
  dividendYield?: number
  peRatio?: number
  marketCap?: number
  lastUpdated: string
  createdAt: string
}

export type AssetType = 
  | 'stock' 
  | 'etf' 
  | 'bond' 
  | 'crypto' 
  | 'commodity' 
  | 'real_estate' 
  | 'cash'

export interface AssetAllocation {
  assetType: AssetType
  value: number
  percentage: number
  target?: number // Target allocation percentage
}

export interface Transaction {
  id: string
  portfolioId: string
  assetId: string
  transactionType: TransactionType
  symbol: string
  quantity: number
  price: number
  fees: number
  totalAmount: number
  transactionDate: string
  notes?: string
  createdAt: string
}

export type TransactionType = 'buy' | 'sell' | 'dividend' | 'split' | 'transfer'

export interface PerformanceData {
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  timePeriods: {
    oneDay: PerformancePeriod
    oneWeek: PerformancePeriod
    oneMonth: PerformancePeriod
    threeMonths: PerformancePeriod
    sixMonths: PerformancePeriod
    oneYear: PerformancePeriod
    threeYears: PerformancePeriod
    fiveYears: PerformancePeriod
    inception: PerformancePeriod
  }
  benchmarkComparison?: BenchmarkComparison
}

export interface PerformancePeriod {
  return: number
  returnPercent: number
  startValue: number
  endValue: number
  startDate: string
  endDate: string
}

export interface BenchmarkComparison {
  benchmarkName: string
  benchmarkSymbol: string
  portfolioReturn: number
  benchmarkReturn: number
  outperformance: number
  correlation: number
}

export interface MarketData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  peRatio?: number
  dividendYield?: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  timestamp: string
}

export interface HistoricalPrice {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  adjustedClose: number
}

export interface WatchlistItem {
  id: string
  userId: string
  symbol: string
  name: string
  currentPrice: number
  change: number
  changePercent: number
  addedAt: string
}

export interface Alert {
  id: string
  userId: string
  portfolioId?: string
  symbol?: string
  type: AlertType
  condition: AlertCondition
  targetValue: number
  currentValue: number
  isTriggered: boolean
  isActive: boolean
  message: string
  createdAt: string
  triggeredAt?: string
}

export type AlertType = 
  | 'price_above' 
  | 'price_below' 
  | 'percent_change' 
  | 'portfolio_value' 
  | 'allocation_drift'

export interface AlertCondition {
  operator: 'greater_than' | 'less_than' | 'equals'
  value: number
  period?: '1d' | '1w' | '1m' | '3m' | '6m' | '1y'
}

// API Request/Response Types
export interface CreatePortfolioRequest {
  name: string
  description: string
  currency: Currency
}

export interface UpdatePortfolioRequest {
  name?: string
  description?: string
  currency?: Currency
}

export interface AddAssetRequest {
  symbol: string
  quantity: number
  price: number
  transaction_date?: string
  notes?: string
}

export interface UpdateAssetRequest {
  quantity?: number
  currentPrice?: number
  notes?: string
}

export interface CreateTransactionRequest {
  assetId: string
  transactionType: TransactionType
  symbol: string
  quantity: number
  price: number
  fees?: number
  transactionDate: string
  notes?: string
}

// Chart and Analytics Types
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface AllocationChartData {
  labels: string[]
  datasets: {
    data: number[]
    backgroundColor: string[]
    borderColor: string[]
  }[]
}

export interface PerformanceChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor: string
    backgroundColor: string
    tension?: number
  }[]
}

export interface AnalyticsData {
  portfolioMetrics: PortfolioMetrics
  riskMetrics: RiskMetrics
  diversificationMetrics: DiversificationMetrics
  correlationMatrix: CorrelationMatrix
}

export interface PortfolioMetrics {
  totalValue: number
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  informationRatio: number
  treynorRatio: number
  jensenAlpha: number
  maximumDrawdown: number
  calmarRatio: number
}

export interface RiskMetrics {
  portfolioBeta: number
  valueAtRisk: number
  conditionalVaR: number
  trackingError: number
  downSideDeviation: number
  sortinoRatio: number
  probabilityOfLoss: number
}

export interface DiversificationMetrics {
  numberOfHoldings: number
  effectiveNumberOfStocks: number
  herfindahlIndex: number
  diversificationRatio: number
  concentrationRisk: number
  sectorConcentration: Record<string, number>
  geographicConcentration: Record<string, number>
}

export interface CorrelationMatrix {
  assets: string[]
  correlations: number[][]
  averageCorrelation: number
}

// Filter and Sort Types
export interface PortfolioFilters {
  search?: string
  assetType?: AssetType[]
  minValue?: number
  maxValue?: number
  sector?: string[]
  sortBy?: PortfolioSortBy
  sortOrder?: 'asc' | 'desc'
}

export type PortfolioSortBy = 
  | 'name' 
  | 'totalValue' 
  | 'totalReturn' 
  | 'dayChange' 
  | 'createdAt'

export interface AssetFilters {
  search?: string
  assetType?: AssetType[]
  sector?: string[]
  minWeight?: number
  maxWeight?: number
  sortBy?: AssetSortBy
  sortOrder?: 'asc' | 'desc'
}

export type AssetSortBy = 
  | 'symbol' 
  | 'name' 
  | 'marketValue' 
  | 'weight' 
  | 'unrealizedGainLoss' 
  | 'dayChange'

// Rebalancing Types
export interface RebalanceRecommendation {
  id: string
  portfolioId: string
  targetAllocation: AssetAllocation[]
  currentAllocation: AssetAllocation[]
  trades: RebalanceTrade[]
  estimatedCosts: number
  expectedImprovement: number
  createdAt: string
}

export interface RebalanceTrade {
  symbol: string
  action: 'buy' | 'sell'
  quantity: number
  estimatedPrice: number
  estimatedValue: number
  reasoning: string
}

// Error Types
export interface APIError {
  code: string
  message: string
  details?: Record<string, unknown>
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type PortfolioSummary = Pick<
  Portfolio,
  'id' | 'name' | 'totalValue' | 'dayChange' | 'dayChangePercent' | 'updatedAt'
>

export type AssetSummary = Pick<
  Asset,
  'id' | 'symbol' | 'name' | 'marketValue' | 'weight' | 'unrealizedGainLoss'
>