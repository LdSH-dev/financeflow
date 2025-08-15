# System Architecture Documentation

## 🏗️ Architecture Overview

This portfolio management system follows a modern, microservices-inspired architecture with clear separation of concerns, designed for scalability and maintainability.

## 🎯 Architectural Principles

### 1. Separation of Concerns
- **Frontend**: Pure presentation layer with Vue 3 components
- **Backend**: Business logic and data access with FastAPI
- **Database**: Data persistence with PostgreSQL
- **Cache**: Performance optimization with Redis

### 2. Domain-Driven Design
- **User Management**: Authentication and user profiles
- **Portfolio Management**: Core business logic for portfolios and assets
- **Transaction Management**: Financial transaction handling
- **Analytics**: Performance calculations and reporting

### 3. API-First Development
- **RESTful APIs**: Standard HTTP methods and status codes
- **OpenAPI Documentation**: Automatic API documentation generation
- **Versioning**: API versioning strategy for backward compatibility
- **Type Safety**: Pydantic models for request/response validation

## 🏛️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Vue 3 SPA │ Mobile App │ Third-party Integrations          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Gateway Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Nginx Reverse Proxy │ Load Balancer │ SSL Termination      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 Application Layer                           │
├─────────────────────────────────────────────────────────────┤
│  FastAPI │ Authentication │ Business Logic │ API Endpoints  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Portfolio Service │ Auth Service │ Transaction Service     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL │ Redis Cache │ File Storage                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Frontend Architecture

### Vue 3 Application Structure

```
src/
├── components/              # Reusable UI components
│   ├── charts/             # Data visualization components
│   │   ├── AllocationChart.vue
│   │   └── PerformanceChart.vue
│   ├── dashboard/          # Dashboard-specific components
│   │   ├── RecentActivity.vue
│   │   └── SummaryCard.vue
│   ├── layout/             # Layout and navigation
│   │   ├── AppNavigation.vue
│   │   ├── Breadcrumb.vue
│   │   └── ThemeToggle.vue
│   ├── modals/             # Modal dialogs
│   │   ├── ConfirmationModal.vue
│   │   └── EditAssetModal.vue
│   └── portfolio/          # Portfolio management
│       └── PortfolioTable.vue
├── views/                  # Page-level components
│   ├── auth/              # Authentication pages
│   │   ├── LoginView.vue
│   │   └── RegisterView.vue
│   ├── portfolio/         # Portfolio management pages
│   │   ├── PortfolioListView.vue
│   │   ├── PortfolioDetailView.vue
│   │   └── AddAssetView.vue
│   └── DashboardView.vue  # Main dashboard
├── stores/                # Pinia state management
│   ├── auth.ts           # Authentication state
│   ├── portfolio.ts      # Portfolio data and operations
│   └── ui.ts             # UI state (theme, modals, etc.)
├── composables/           # Reusable composition functions
│   ├── useApi.ts         # HTTP client with error handling
│   ├── useConfirmation.ts # Modal confirmation logic
│   └── useKeyboardShortcuts.ts # Keyboard navigation
├── types/                 # TypeScript type definitions
│   ├── api.ts            # API response types
│   └── portfolio.ts      # Business domain types
└── utils/                 # Utility functions
    ├── api.ts            # API client configuration
    └── format.ts         # Data formatting utilities
```

### State Management Strategy

#### Pinia Stores
- **Auth Store**: User authentication, session management
- **Portfolio Store**: Portfolio data, CRUD operations, real-time updates
- **UI Store**: Application UI state, theme preferences, modal state

#### Composables Pattern
- **useApi**: Centralized HTTP client with error handling and loading states
- **useConfirmation**: Reusable confirmation dialog logic
- **useKeyboardShortcuts**: Application-wide keyboard navigation

### Component Architecture

#### Atomic Design Principles
- **Atoms**: Basic UI elements (buttons, inputs, icons)
- **Molecules**: Component combinations (form fields, cards)
- **Organisms**: Complex components (navigation, tables, charts)
- **Templates**: Page layouts and structure
- **Pages**: Complete page implementations

## 🚀 Backend Architecture

### FastAPI Application Structure

```
backend/app/
├── api/                   # API layer
│   └── v1/               # API version 1
│       ├── auth.py       # Authentication endpoints
│       ├── portfolios.py # Portfolio management endpoints
│       ├── transactions.py # Transaction endpoints
│       └── router.py     # Main API router
├── core/                 # Core functionality
│   ├── config.py        # Application configuration
│   └── database.py      # Database connection and session management
├── db/                   # Database layer
│   └── models.py        # SQLAlchemy models
├── schemas/              # Data validation
│   ├── auth.py          # Authentication schemas
│   ├── portfolio.py     # Portfolio schemas
│   └── user.py          # User schemas
├── services/             # Business logic layer
│   ├── auth_service.py  # Authentication business logic
│   ├── portfolio_service.py # Portfolio management logic
│   └── transaction_service.py # Transaction processing
└── main.py              # Application entry point
```

### Service Layer Pattern

#### Authentication Service
- User registration and login
- JWT token generation and validation
- Password hashing and verification
- Session management

#### Portfolio Service
- Portfolio CRUD operations
- Asset management within portfolios
- Performance calculations
- Risk assessment algorithms

#### Transaction Service
- Transaction recording and validation
- Portfolio balance updates
- Transaction history and reporting
- Audit trail maintenance

### Database Design

#### Entity Relationship Model

```sql
Users
├── id (Primary Key)
├── email (Unique)
├── password_hash
├── first_name
├── last_name
├── created_at
└── updated_at

Portfolios
├── id (Primary Key)
├── user_id (Foreign Key → Users.id)
├── name
├── description
├── currency
├── created_at
└── updated_at

Assets
├── id (Primary Key)
├── portfolio_id (Foreign Key → Portfolios.id)
├── symbol
├── name
├── asset_type
├── quantity
├── purchase_price
├── current_price
├── created_at
└── updated_at

Transactions
├── id (Primary Key)
├── portfolio_id (Foreign Key → Portfolios.id)
├── asset_id (Foreign Key → Assets.id)
├── transaction_type (buy/sell)
├── quantity
├── price
├── transaction_date
└── created_at
```

## 🔄 Data Flow Architecture

### Request-Response Cycle

1. **Frontend Request**
   - User interaction triggers Vue component
   - Pinia store action called
   - HTTP request sent via useApi composable

2. **API Processing**
   - Nginx routes request to FastAPI
   - Authentication middleware validates JWT
   - Route handler processes request
   - Service layer executes business logic

3. **Data Layer**
   - SQLAlchemy queries database
   - Redis cache checked/updated
   - Data validation with Pydantic

4. **Response Handling**
   - Structured response returned
   - Frontend store updated
   - UI components reactively update

### Real-time Updates (WebSocket Ready)

```
Client ←→ WebSocket Connection ←→ FastAPI ←→ Redis Pub/Sub
```

## 🔐 Security Architecture

### Authentication Flow

1. **User Login**
   - Credentials validated against database
   - JWT access token generated (15 minutes)
   - JWT refresh token generated (7 days)
   - Tokens stored securely in HTTP-only cookies

2. **Request Authorization**
   - Access token validated on each request
   - User context attached to request
   - Role-based access control applied

3. **Token Refresh**
   - Automatic token refresh before expiration
   - Refresh token rotation for security
   - Logout invalidates all tokens

### Security Layers

- **Input Validation**: Pydantic schemas validate all inputs
- **SQL Injection Prevention**: SQLAlchemy ORM usage
- **XSS Protection**: Content Security Policy headers
- **CSRF Protection**: SameSite cookie attributes
- **Rate Limiting**: Request throttling (ready for implementation)

## 📊 Performance Architecture

### Caching Strategy

#### Redis Cache Layers
- **Session Cache**: User sessions and authentication tokens
- **Data Cache**: Frequently accessed portfolio data
- **Query Cache**: Expensive database query results
- **Application Cache**: Configuration and metadata

#### Frontend Optimization
- **Code Splitting**: Route-based lazy loading
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image compression and modern formats
- **Service Worker**: Offline functionality (ready for implementation)

### Database Optimization

#### Indexing Strategy
```sql
-- User lookup optimization
CREATE INDEX idx_users_email ON users(email);

-- Portfolio queries optimization
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_assets_portfolio_id ON assets(portfolio_id);

-- Transaction history optimization
CREATE INDEX idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX idx_transactions_date ON transactions(transaction_date);
```

## 🚀 Deployment Architecture

### Containerization Strategy

#### Multi-Stage Docker Builds
- **Frontend**: Node.js build → Nginx static serving
- **Backend**: Python dependencies → FastAPI application
- **Database**: PostgreSQL with initialization scripts
- **Cache**: Redis with persistence configuration

#### Service Orchestration
```yaml
services:
  frontend:    # Vue 3 SPA served by Nginx
  backend:     # FastAPI application
  db:          # PostgreSQL database
  redis:       # Redis cache
  nginx:       # Reverse proxy and load balancer
  celery:      # Background task processing
  flower:      # Task monitoring
```

### Scalability Considerations

#### Horizontal Scaling
- **Stateless Services**: All services designed for horizontal scaling
- **Load Balancing**: Nginx configuration for multiple backend instances
- **Database Scaling**: Read replicas and connection pooling
- **Cache Distribution**: Redis cluster configuration

#### Monitoring and Observability
- **Health Checks**: Built-in health endpoints for all services
- **Logging**: Structured logging with correlation IDs
- **Metrics**: Application and infrastructure metrics collection
- **Alerting**: Automated alerting for critical issues

## 🔮 Future Architecture Evolution

### Microservices Migration Path

1. **Phase 1**: Extract authentication service
2. **Phase 2**: Separate portfolio and transaction services
3. **Phase 3**: Add market data service
4. **Phase 4**: Implement event-driven architecture

### Technology Evolution

- **Message Queue**: RabbitMQ or Apache Kafka for event streaming
- **API Gateway**: Kong or AWS API Gateway for advanced routing
- **Service Mesh**: Istio for service-to-service communication
- **Observability**: Prometheus, Grafana, and Jaeger for monitoring

This architecture provides a solid foundation for a production-ready portfolio management system while maintaining flexibility for future enhancements and scaling requirements.