"""
Tests for service layer functionality
"""

import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import HTTPException

from app.services.auth_service import AuthService
from app.services.portfolio_service import PortfolioService
from app.services.transaction_service import TransactionService
from app.schemas.portfolio import PortfolioCreate, PortfolioUpdate, AssetCreate
from app.schemas.user import UserCreate
from app.db.models import User, Portfolio, Asset, Transaction, TransactionType


class TestAuthService:
    """Test authentication service functionality."""

    async def test_create_user_success(self, test_db: AsyncSession):
        """Test successful user creation."""
        auth_service = AuthService(test_db)
        
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        
        user = await auth_service.create_user(user_data)
        
        assert user.email == "test@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.is_active is True
        assert user.is_verified is False

    async def test_create_user_duplicate_email(self, test_db: AsyncSession):
        """Test creating user with duplicate email."""
        auth_service = AuthService(test_db)
        
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        
        # Create first user
        await auth_service.create_user(user_data)
        
        # Try to create second user with same email
        with pytest.raises(HTTPException) as exc_info:
            await auth_service.create_user(user_data)
        
        assert exc_info.value.status_code == 400
        assert "Email already registered" in str(exc_info.value.detail)

    async def test_authenticate_user_success(self, test_db: AsyncSession):
        """Test successful user authentication."""
        auth_service = AuthService(test_db)
        
        # Create user first
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        await auth_service.create_user(user_data)
        
        # Authenticate user
        from app.schemas.auth import LoginRequest
        login_request = LoginRequest(email="test@example.com", password="password123")
        user = await auth_service.authenticate_user(login_request)
        
        assert user is not None
        assert user.email == "test@example.com"

    async def test_authenticate_user_wrong_password(self, test_db: AsyncSession):
        """Test authentication with wrong password."""
        auth_service = AuthService(test_db)
        
        # Create user first
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        await auth_service.create_user(user_data)
        
        # Try to authenticate with wrong password
        from app.schemas.auth import LoginRequest
        login_request = LoginRequest(email="test@example.com", password="wrong_password")
        user = await auth_service.authenticate_user(login_request)
        
        assert user is None

    async def test_authenticate_user_nonexistent(self, test_db: AsyncSession):
        """Test authentication with non-existent user."""
        auth_service = AuthService(test_db)
        
        # Try to authenticate non-existent user
        from app.schemas.auth import LoginRequest
        login_request = LoginRequest(email="nonexistent@example.com", password="password123")
        user = await auth_service.authenticate_user(login_request)
        
        assert user is None

    async def test_get_user_by_email(self, test_db: AsyncSession):
        """Test getting user by email."""
        auth_service = AuthService(test_db)
        
        # Create user first
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        created_user = await auth_service.create_user(user_data)
        
        # Get user by email
        user = await auth_service.get_user_by_email("test@example.com")
        
        assert user is not None
        assert user.id == created_user.id
        assert user.email == "test@example.com"

    async def test_get_user_by_id(self, test_db: AsyncSession):
        """Test getting user by ID."""
        auth_service = AuthService(test_db)
        
        # Create user first
        user_data = UserCreate(
            email="test@example.com",
            password="password123",
            password_confirm="password123",
            first_name="Test",
            last_name="User",
            accept_terms=True
        )
        created_user = await auth_service.create_user(user_data)
        
        # Get user by ID
        user = await auth_service.get_user_by_id(created_user.id)
        
        assert user is not None
        assert user.id == created_user.id
        assert user.email == "test@example.com"


class TestPortfolioService:
    """Test portfolio service functionality."""

    async def test_create_portfolio_success(self, test_db: AsyncSession):
        """Test successful portfolio creation."""
        service = PortfolioService(test_db)
        
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        assert portfolio.name == "Test Portfolio"
        assert portfolio.description == "Test Description"
        assert portfolio.currency == "USD"
        assert portfolio.user_id == user_id
        assert portfolio.total_value == Decimal('0')
        assert portfolio.total_cost == Decimal('0')

    async def test_create_portfolio_duplicate_name(self, test_db: AsyncSession):
        """Test creating portfolio with duplicate name."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        
        # Create first portfolio
        await service.create_portfolio(user_id, portfolio_data)
        
        # Try to create second with same name
        with pytest.raises(HTTPException) as exc_info:
            await service.create_portfolio(user_id, portfolio_data)
        
        assert exc_info.value.status_code == 400
        assert "Portfolio with this name already exists" in str(exc_info.value.detail)

    async def test_get_portfolios(self, test_db: AsyncSession):
        """Test getting user portfolios."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Initially no portfolios
        portfolios = await service.get_portfolios(user_id)
        assert len(portfolios) == 0
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        await service.create_portfolio(user_id, portfolio_data)
        
        # Now should have one portfolio
        portfolios = await service.get_portfolios(user_id)
        assert len(portfolios) == 1
        assert portfolios[0].name == "Test Portfolio"

    async def test_get_portfolio_by_id(self, test_db: AsyncSession):
        """Test getting specific portfolio by ID."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Get portfolio by ID
        portfolio = await service.get_portfolio(created_portfolio.id, user_id)
        
        assert portfolio is not None
        assert portfolio.id == created_portfolio.id
        assert portfolio.name == "Test Portfolio"

    async def test_get_portfolio_wrong_user(self, test_db: AsyncSession):
        """Test getting portfolio with wrong user ID."""
        service = PortfolioService(test_db)
        
        # Use valid UUID formats for user_ids
        import uuid
        user1_id = str(uuid.uuid4())
        user2_id = str(uuid.uuid4())
        
        # Create portfolio for user1
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user1_id, portfolio_data)
        
        # Try to get portfolio as user2
        portfolio = await service.get_portfolio(created_portfolio.id, user2_id)
        
        assert portfolio is None

    async def test_update_portfolio(self, test_db: AsyncSession):
        """Test updating portfolio."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Update portfolio
        update_data = PortfolioUpdate(
            name="Updated Portfolio",
            description="Updated Description"
        )
        updated_portfolio = await service.update_portfolio(
            created_portfolio.id, user_id, update_data
        )
        
        assert updated_portfolio is not None
        assert updated_portfolio.name == "Updated Portfolio"
        assert updated_portfolio.description == "Updated Description"

    async def test_delete_portfolio(self, test_db: AsyncSession):
        """Test deleting portfolio."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Delete portfolio
        success = await service.delete_portfolio(created_portfolio.id, user_id)
        
        assert success is True
        
        # Verify portfolio is deleted
        portfolio = await service.get_portfolio(created_portfolio.id, user_id)
        assert portfolio is None

    async def test_add_asset_to_portfolio(self, test_db: AsyncSession):
        """Test adding asset to portfolio."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Add asset
        asset_data = AssetCreate(
            symbol="AAPL",
            quantity=10.0,
            price=150.00,
            notes="Test asset"
        )
        
        asset = await service.add_asset(created_portfolio.id, user_id, asset_data)
        
        assert asset is not None
        assert asset.symbol == "AAPL"
        assert asset.quantity == Decimal('10.0')
        assert asset.portfolio_id == created_portfolio.id

    async def test_get_portfolio_allocation(self, test_db: AsyncSession):
        """Test getting portfolio allocation."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Get allocation (should be empty initially)
        allocation = await service.get_portfolio_allocation(created_portfolio.id, user_id)
        
        assert isinstance(allocation, list)
        assert len(allocation) == 0

    async def test_calculate_portfolio_performance(self, test_db: AsyncSession):
        """Test calculating portfolio performance."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create portfolio
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        created_portfolio = await service.create_portfolio(user_id, portfolio_data)
        
        # Calculate performance (may return performance data or None for empty portfolio)
        performance = await service.calculate_portfolio_performance(created_portfolio.id, user_id)
        
        # Performance can be None or a PerformanceData object
        assert performance is None or hasattr(performance, 'total_return')

    async def test_get_recent_activities(self, test_db: AsyncSession):
        """Test getting recent activities."""
        service = PortfolioService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Get activities for user with no portfolios
        activities = await service.get_recent_activities(user_id, 10)
        
        assert isinstance(activities, list)
        assert len(activities) == 0


class TestTransactionService:
    """Test transaction service functionality."""

    async def test_get_transactions_empty(self, test_db: AsyncSession):
        """Test getting transactions for user with none."""
        service = TransactionService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        transactions = await service.get_transactions(user_id)
        
        assert isinstance(transactions, list)
        assert len(transactions) == 0

    async def test_get_transaction_summary_empty(self, test_db: AsyncSession):
        """Test getting transaction summary for user with no transactions."""
        service = TransactionService(test_db)
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        summary = await service.get_transaction_summary(user_id)
        
        assert isinstance(summary, dict)
        assert "total_transactions" in summary
        # The actual field might be different, let's check what's returned
        assert summary["total_transactions"] == 0

    async def test_transaction_filters(self, test_db: AsyncSession):
        """Test transaction filtering."""
        service = TransactionService(test_db)
        
        # Use valid UUID formats
        import uuid
        user_id = str(uuid.uuid4())
        portfolio_id = str(uuid.uuid4())
        asset_id = str(uuid.uuid4())
        
        # Test with various filters
        transactions = await service.get_transactions(
            user_id=user_id,
            portfolio_id=portfolio_id,
            asset_id=asset_id,
            transaction_type=TransactionType.BUY,
            start_date=datetime.now(),
            end_date=datetime.now(),
            page=1,
            limit=10
        )
        
        assert isinstance(transactions, list)

    async def test_get_transaction_by_id_not_found(self, test_db: AsyncSession):
        """Test getting non-existent transaction."""
        service = TransactionService(test_db)
        
        # Use valid UUID formats
        import uuid
        user_id = str(uuid.uuid4())
        transaction_id = str(uuid.uuid4())
        
        transaction = await service.get_transaction(transaction_id, user_id)
        
        assert transaction is None

    async def test_update_transaction_not_found(self, test_db: AsyncSession):
        """Test updating non-existent transaction."""
        service = TransactionService(test_db)
        
        # Use valid UUID formats
        import uuid
        user_id = str(uuid.uuid4())
        transaction_id = str(uuid.uuid4())
        
        transaction = await service.update_transaction(
            transaction_id, 
            user_id, 
            {"quantity": 10.0}
        )
        
        assert transaction is None

    async def test_delete_transaction_not_found(self, test_db: AsyncSession):
        """Test deleting non-existent transaction."""
        service = TransactionService(test_db)
        
        # Use valid UUID formats
        import uuid
        user_id = str(uuid.uuid4())
        transaction_id = str(uuid.uuid4())
        
        success = await service.delete_transaction(transaction_id, user_id)
        
        assert success is False