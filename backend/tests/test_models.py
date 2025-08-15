"""
Tests for database models
"""

import pytest
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.models import (
    User, Portfolio, Asset, Transaction, 
    TransactionType, AssetType, Currency, RiskTolerance
)


class TestUserModel:
    """Test User model functionality."""

    async def test_create_user(self, test_db: AsyncSession):
        """Test creating a user."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.first_name == "Test"
        assert user.last_name == "User"
        assert user.is_active is True
        assert user.is_verified is False
        assert user.preferred_currency == Currency.USD
        assert user.risk_tolerance == RiskTolerance.MODERATE
        assert user.created_at is not None
        assert user.updated_at is not None

    async def test_user_defaults(self, test_db: AsyncSession):
        """Test user default values."""
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        # Test default values
        assert user.is_active is True
        assert user.is_verified is False
        assert user.preferred_currency == Currency.USD
        assert user.timezone == "UTC"
        assert user.theme == "system"
        assert user.risk_tolerance == RiskTolerance.MODERATE
        assert user.email_notifications is True
        assert user.push_notifications is True
        assert user.portfolio_alerts is True
        assert user.market_news is False

    async def test_user_unique_email(self, test_db: AsyncSession):
        """Test that user email must be unique."""
        user1 = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test1",
            last_name="User1"
        )
        
        user2 = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test2",
            last_name="User2"
        )
        
        test_db.add(user1)
        await test_db.commit()
        
        test_db.add(user2)
        
        # Should raise an exception due to unique constraint
        with pytest.raises(Exception):
            await test_db.commit()




class TestPortfolioModel:
    """Test Portfolio model functionality."""

    async def test_create_portfolio(self, test_db: AsyncSession):
        """Test creating a portfolio."""
        # Create user first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        # Create portfolio
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        assert portfolio.id is not None
        assert portfolio.user_id == user.id
        assert portfolio.name == "Test Portfolio"
        assert portfolio.description == "Test Description"
        assert portfolio.currency == "USD"
        assert portfolio.total_value == Decimal('0')
        assert portfolio.total_cost == Decimal('0')
        assert portfolio.day_change == Decimal('0')
        assert portfolio.day_change_percent == Decimal('0')
        assert portfolio.created_at is not None
        assert portfolio.updated_at is not None

    async def test_portfolio_defaults(self, test_db: AsyncSession):
        """Test portfolio default values."""
        # Create user first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        # Create portfolio with minimal data
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        # Test default values
        assert portfolio.total_value == Decimal('0')
        assert portfolio.total_cost == Decimal('0')
        assert portfolio.day_change == Decimal('0')
        assert portfolio.day_change_percent == Decimal('0')




class TestAssetModel:
    """Test Asset model functionality."""

    async def test_create_asset(self, test_db: AsyncSession):
        """Test creating an asset."""
        # Create user and portfolio first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        # Create asset
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00'),
            current_price=Decimal('155.00')
        )
        
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        assert asset.id is not None
        assert asset.portfolio_id == portfolio.id
        assert asset.symbol == "AAPL"
        assert asset.name == "Apple Inc."
        assert asset.asset_type == AssetType.STOCK
        assert asset.quantity == Decimal('10.0')
        assert asset.average_cost == Decimal('150.00')
        assert asset.current_price == Decimal('155.00')
        assert asset.created_at is not None
        assert asset.updated_at is not None

    async def test_asset_calculated_fields(self, test_db: AsyncSession):
        """Test asset calculated fields."""
        # Create user and portfolio first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        # Create asset with calculated fields
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00'),
            current_price=Decimal('155.00'),
            market_value=Decimal('1550.00'),  # 10 * 155
            total_cost=Decimal('1500.00'),    # 10 * 150
            unrealized_gain_loss=Decimal('50.00')  # 1550 - 1500
        )
        
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        assert asset.market_value == Decimal('1550.00')
        assert asset.total_cost == Decimal('1500.00')
        assert asset.unrealized_gain_loss == Decimal('50.00')

    async def test_asset_defaults(self, test_db: AsyncSession):
        """Test asset default values."""
        # Create user and portfolio first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        # Create asset with minimal data
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",  # Required field
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00')
        )
        
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        # Test default values
        assert asset.current_price == Decimal('0')
        assert asset.market_value == Decimal('0')
        assert asset.total_cost == Decimal('0')
        assert asset.unrealized_gain_loss == Decimal('0')
        assert asset.day_change == Decimal('0')
        assert asset.day_change_percent == Decimal('0')
        assert asset.weight == Decimal('0')


class TestTransactionModel:
    """Test Transaction model functionality."""

    async def test_create_transaction(self, test_db: AsyncSession):
        """Test creating a transaction."""
        # Create user, portfolio, and asset first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",  # Required field
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00')
        )
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        # Create transaction
        transaction = Transaction(
            portfolio_id=portfolio.id,
            asset_id=asset.id,
            transaction_type=TransactionType.BUY,
            symbol="AAPL",
            quantity=Decimal('5.0'),
            price=Decimal('155.00'),
            fees=Decimal('1.00'),
            total_amount=Decimal('776.00'),  # (5 * 155) + 1
            transaction_date=datetime.now(),
            notes="Test transaction"
        )
        
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)
        
        assert transaction.id is not None
        assert transaction.portfolio_id == portfolio.id
        assert transaction.asset_id == asset.id
        assert transaction.transaction_type == TransactionType.BUY
        assert transaction.symbol == "AAPL"
        assert transaction.quantity == Decimal('5.0')
        assert transaction.price == Decimal('155.00')
        assert transaction.fees == Decimal('1.00')
        assert transaction.total_amount == Decimal('776.00')
        assert transaction.notes == "Test transaction"
        assert transaction.created_at is not None

    async def test_transaction_defaults(self, test_db: AsyncSession):
        """Test transaction default values."""
        # Create user, portfolio, and asset first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",  # Required field
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00')
        )
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        # Create transaction with minimal data
        transaction = Transaction(
            portfolio_id=portfolio.id,
            asset_id=asset.id,
            transaction_type=TransactionType.BUY,
            symbol="AAPL",
            quantity=Decimal('5.0'),
            price=Decimal('155.00'),
            total_amount=Decimal('775.00'),  # Required field
            transaction_date=datetime.now()
        )
        
        test_db.add(transaction)
        await test_db.commit()
        await test_db.refresh(transaction)
        
        # Test default values
        assert transaction.fees == Decimal('0')
        # total_amount was set explicitly, so it won't be 0

    async def test_transaction_types(self, test_db: AsyncSession):
        """Test different transaction types."""
        # Create user, portfolio, and asset first
        user = User(
            email="test@example.com",
            password_hash="hashed_password",
            first_name="Test",
            last_name="User"
        )
        test_db.add(user)
        await test_db.commit()
        await test_db.refresh(user)
        
        portfolio = Portfolio(
            user_id=user.id,
            name="Test Portfolio",
            currency="USD"
        )
        test_db.add(portfolio)
        await test_db.commit()
        await test_db.refresh(portfolio)
        
        asset = Asset(
            portfolio_id=portfolio.id,
            symbol="AAPL",
            name="Apple Inc.",  # Required field
            asset_type=AssetType.STOCK,
            quantity=Decimal('10.0'),
            average_cost=Decimal('150.00')
        )
        test_db.add(asset)
        await test_db.commit()
        await test_db.refresh(asset)
        
        # Test different transaction types
        transaction_types = [
            TransactionType.BUY,
            TransactionType.SELL,
            TransactionType.DIVIDEND,
            TransactionType.SPLIT,
            TransactionType.TRANSFER
        ]
        
        for tx_type in transaction_types:
            transaction = Transaction(
                portfolio_id=portfolio.id,
                asset_id=asset.id,
                transaction_type=tx_type,
                symbol="AAPL",
                quantity=Decimal('1.0'),
                price=Decimal('155.00'),
                total_amount=Decimal('155.00'),  # Required field
                transaction_date=datetime.now()
            )
            
            test_db.add(transaction)
            await test_db.commit()
            await test_db.refresh(transaction)
            
            assert transaction.transaction_type == tx_type


class TestEnums:
    """Test enum values."""

    def test_currency_enum(self):
        """Test Currency enum values."""
        assert Currency.USD == "USD"
        assert Currency.EUR == "EUR"
        assert Currency.GBP == "GBP"
        assert Currency.JPY == "JPY"
        assert Currency.CAD == "CAD"
        assert Currency.AUD == "AUD"

    def test_asset_type_enum(self):
        """Test AssetType enum values."""
        assert AssetType.STOCK == "stock"
        assert AssetType.ETF == "etf"
        assert AssetType.BOND == "bond"
        assert AssetType.CRYPTO == "crypto"
        assert AssetType.COMMODITY == "commodity"
        assert AssetType.REAL_ESTATE == "real_estate"
        assert AssetType.CASH == "cash"

    def test_transaction_type_enum(self):
        """Test TransactionType enum values."""
        assert TransactionType.BUY == "buy"
        assert TransactionType.SELL == "sell"
        assert TransactionType.DIVIDEND == "dividend"
        assert TransactionType.SPLIT == "split"
        assert TransactionType.TRANSFER == "transfer"

    def test_risk_tolerance_enum(self):
        """Test RiskTolerance enum values."""
        assert RiskTolerance.CONSERVATIVE == "conservative"
        assert RiskTolerance.MODERATE == "moderate"
        assert RiskTolerance.AGGRESSIVE == "aggressive"