# API Documentation

## 🔗 API Overview

The Portfolio Management System provides a RESTful API built with FastAPI, featuring automatic OpenAPI documentation, type validation, and comprehensive error handling.

**Base URL**: `http://localhost:8000/api/v1`  
**Documentation**: `http://localhost:8000/docs` (Swagger UI)  
**Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

## 🔐 Authentication

### JWT Token-Based Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST `/auth/register`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

#### POST `/auth/login`
Authenticate user and receive JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

#### POST `/auth/refresh`
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

#### GET `/auth/me`
Get current user information.

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200):**
```json
{
  "id": 1,
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 📊 Portfolio Management

### Portfolio Endpoints

#### GET `/portfolios`
Get all portfolios for the authenticated user.

**Query Parameters:**
- `include_assets` (boolean, optional): Include assets in response
- `include_performance` (boolean, optional): Include performance data

**Headers:**
```http
Authorization: Bearer <access-token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "name": "My Investment Portfolio",
    "description": "Long-term investment strategy",
    "currency": "USD",
    "total_value": 50000.00,
    "day_change": 250.50,
    "day_change_percent": 0.5,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T15:45:00Z",
    "assets": [
      {
        "id": 1,
        "symbol": "AAPL",
        "name": "Apple Inc.",
        "asset_type": "stock",
        "quantity": 100,
        "purchase_price": 150.00,
        "current_price": 155.25,
        "total_value": 15525.00,
        "unrealized_gain_loss": 525.00,
        "unrealized_gain_loss_percent": 3.5
      }
    ]
  }
]
```

#### POST `/portfolios`
Create a new portfolio.

**Request Body:**
```json
{
  "name": "Tech Growth Portfolio",
  "description": "Focus on technology growth stocks",
  "currency": "USD"
}
```

**Response (201):**
```json
{
  "id": 2,
  "name": "Tech Growth Portfolio",
  "description": "Focus on technology growth stocks",
  "currency": "USD",
  "total_value": 0.00,
  "day_change": 0.00,
  "day_change_percent": 0.0,
  "created_at": "2024-01-15T16:00:00Z",
  "updated_at": "2024-01-15T16:00:00Z"
}
```

#### GET `/portfolios/{portfolio_id}`
Get a specific portfolio by ID.

**Path Parameters:**
- `portfolio_id` (integer): Portfolio ID

**Query Parameters:**
- `include_assets` (boolean, optional): Include assets in response
- `include_performance` (boolean, optional): Include performance data

**Response (200):**
```json
{
  "id": 1,
  "name": "My Investment Portfolio",
  "description": "Long-term investment strategy",
  "currency": "USD",
  "total_value": 50000.00,
  "day_change": 250.50,
  "day_change_percent": 0.5,
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T15:45:00Z",
  "assets": [...],
  "performance": {
    "total_return": 5250.00,
    "total_return_percent": 11.7,
    "annualized_return": 8.5,
    "volatility": 15.2,
    "sharpe_ratio": 0.85
  }
}
```

#### PUT `/portfolios/{portfolio_id}`
Update an existing portfolio.

**Request Body:**
```json
{
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "currency": "EUR"
}
```

**Response (200):**
```json
{
  "id": 1,
  "name": "Updated Portfolio Name",
  "description": "Updated description",
  "currency": "EUR",
  "total_value": 42500.00,
  "day_change": 212.75,
  "day_change_percent": 0.5,
  "updated_at": "2024-01-15T17:00:00Z"
}
```

#### DELETE `/portfolios/{portfolio_id}`
Delete a portfolio and all its assets.

**Response (204):** No content

### Asset Management

#### POST `/portfolios/{portfolio_id}/assets`
Add an asset to a portfolio.

**Request Body:**
```json
{
  "symbol": "GOOGL",
  "name": "Alphabet Inc.",
  "asset_type": "stock",
  "quantity": 50,
  "purchase_price": 2800.00
}
```

**Response (201):**
```json
{
  "id": 2,
  "symbol": "GOOGL",
  "name": "Alphabet Inc.",
  "asset_type": "stock",
  "quantity": 50,
  "purchase_price": 2800.00,
  "current_price": 2850.00,
  "total_value": 142500.00,
  "unrealized_gain_loss": 2500.00,
  "unrealized_gain_loss_percent": 1.79,
  "created_at": "2024-01-15T16:30:00Z"
}
```

#### PUT `/portfolios/{portfolio_id}/assets/{asset_id}`
Update an existing asset.

**Request Body:**
```json
{
  "quantity": 75,
  "purchase_price": 2750.00
}
```

**Response (200):**
```json
{
  "id": 2,
  "symbol": "GOOGL",
  "name": "Alphabet Inc.",
  "asset_type": "stock",
  "quantity": 75,
  "purchase_price": 2750.00,
  "current_price": 2850.00,
  "total_value": 213750.00,
  "unrealized_gain_loss": 7500.00,
  "unrealized_gain_loss_percent": 3.64,
  "updated_at": "2024-01-15T17:15:00Z"
}
```

#### DELETE `/portfolios/{portfolio_id}/assets/{asset_id}`
Remove an asset from a portfolio.

**Response (204):** No content

### Portfolio Analytics

#### GET `/portfolios/{portfolio_id}/allocation`
Get portfolio asset allocation data.

**Response (200):**
```json
{
  "allocations": [
    {
      "asset_type": "stock",
      "percentage": 85.5,
      "value": 42750.00
    },
    {
      "asset_type": "bond",
      "percentage": 10.0,
      "value": 5000.00
    },
    {
      "asset_type": "cash",
      "percentage": 4.5,
      "value": 2250.00
    }
  ],
  "total_value": 50000.00
}
```

#### GET `/portfolios/{portfolio_id}/performance`
Get portfolio performance metrics.

**Query Parameters:**
- `period` (string, optional): Time period (1d, 1w, 1m, 3m, 6m, 1y, all)

**Response (200):**
```json
{
  "period": "1y",
  "total_return": 5250.00,
  "total_return_percent": 11.7,
  "annualized_return": 11.7,
  "volatility": 15.2,
  "sharpe_ratio": 0.85,
  "max_drawdown": -8.5,
  "beta": 1.05,
  "alpha": 2.3,
  "performance_data": [
    {
      "date": "2024-01-01",
      "value": 45000.00,
      "return": 0.0
    },
    {
      "date": "2024-01-15",
      "value": 50250.00,
      "return": 11.7
    }
  ]
}
```

## 💰 Transaction Management

### Transaction Endpoints

#### GET `/portfolios/{portfolio_id}/transactions`
Get transaction history for a portfolio.

**Query Parameters:**
- `limit` (integer, optional): Number of transactions to return (default: 50)
- `offset` (integer, optional): Number of transactions to skip (default: 0)
- `transaction_type` (string, optional): Filter by type (buy, sell)

**Response (200):**
```json
{
  "transactions": [
    {
      "id": 1,
      "asset_id": 1,
      "asset_symbol": "AAPL",
      "transaction_type": "buy",
      "quantity": 100,
      "price": 150.00,
      "total_amount": 15000.00,
      "transaction_date": "2024-01-10T14:30:00Z",
      "created_at": "2024-01-10T14:30:00Z"
    }
  ],
  "total_count": 25,
  "has_more": true
}
```

#### POST `/portfolios/{portfolio_id}/transactions`
Record a new transaction.

**Request Body:**
```json
{
  "asset_id": 1,
  "transaction_type": "buy",
  "quantity": 25,
  "price": 155.50,
  "transaction_date": "2024-01-15T10:00:00Z"
}
```

**Response (201):**
```json
{
  "id": 2,
  "asset_id": 1,
  "asset_symbol": "AAPL",
  "transaction_type": "buy",
  "quantity": 25,
  "price": 155.50,
  "total_amount": 3887.50,
  "transaction_date": "2024-01-15T10:00:00Z",
  "created_at": "2024-01-15T16:45:00Z"
}
```

## 🔍 Error Handling

### Standard Error Response Format

All API errors follow a consistent format:

```json
{
  "detail": "Error message",
  "error_code": "SPECIFIC_ERROR_CODE",
  "timestamp": "2024-01-15T16:45:00Z"
}
```

### HTTP Status Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **204 No Content**: Request successful, no content to return
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **422 Unprocessable Entity**: Validation error
- **500 Internal Server Error**: Server error

### Common Error Codes

#### Authentication Errors
- `AUTH_INVALID_CREDENTIALS`: Invalid email or password
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_USER_NOT_FOUND`: User account not found

#### Validation Errors
- `VALIDATION_ERROR`: Request data validation failed
- `PORTFOLIO_NOT_FOUND`: Portfolio not found or access denied
- `ASSET_NOT_FOUND`: Asset not found in portfolio
- `INSUFFICIENT_QUANTITY`: Not enough asset quantity for transaction

#### Business Logic Errors
- `PORTFOLIO_LIMIT_EXCEEDED`: Maximum portfolio limit reached
- `INVALID_TRANSACTION_TYPE`: Invalid transaction type specified
- `NEGATIVE_QUANTITY_NOT_ALLOWED`: Quantity must be positive

## 📝 Request/Response Examples

### Creating a Complete Portfolio with Assets

```bash
# 1. Register a new user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@example.com",
    "password": "securepassword123",
    "first_name": "Jane",
    "last_name": "Investor"
  }'

# 2. Login to get access token
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "investor@example.com",
    "password": "securepassword123"
  }'

# 3. Create a new portfolio
curl -X POST "http://localhost:8000/api/v1/portfolios" \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Growth Portfolio",
    "description": "Long-term growth investments",
    "currency": "USD"
  }'

# 4. Add assets to the portfolio
curl -X POST "http://localhost:8000/api/v1/portfolios/1/assets" \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "asset_type": "stock",
    "quantity": 100,
    "purchase_price": 150.00
  }'

# 5. Get portfolio with all data
curl -X GET "http://localhost:8000/api/v1/portfolios/1?include_assets=true&include_performance=true" \
  -H "Authorization: Bearer <access-token>"
```

## 🔄 Rate Limiting

The API implements rate limiting to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Portfolio operations**: 100 requests per minute per user
- **Asset operations**: 200 requests per minute per user
- **Read operations**: 500 requests per minute per user

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642262400
```

## 📊 API Versioning

The API uses URL path versioning:
- Current version: `v1`
- Base path: `/api/v1`
- Future versions will be available at `/api/v2`, etc.

Version deprecation policy:
- New versions announced 3 months in advance
- Old versions supported for 12 months after deprecation
- Breaking changes only introduced in new versions

## 🔧 Development Tools

### Interactive API Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPI JSON**: `http://localhost:8000/openapi.json`

### Testing the API
```bash
# Health check
curl http://localhost:8000/api/v1/health

# API documentation
curl http://localhost:8000/openapi.json | jq

# Test authentication
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "testpassword"}'
```

This API documentation provides comprehensive coverage of all available endpoints, authentication methods, and data structures used in the Portfolio Management System.