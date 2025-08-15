"""
Test configuration and fixtures
"""

import pytest
import asyncio
from typing import AsyncGenerator, Generator
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_db, Base
from app.core.config import settings


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Override UUID type for SQLite compatibility
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import String

def visit_UUID(self, type_, **kw):
    return "TEXT"

SQLiteTypeCompiler.visit_UUID = visit_UUID


@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
async def test_db() -> AsyncGenerator[AsyncSession, None]:
    """Create a test database session."""
    
    # Create test engine
    engine = create_async_engine(
        TEST_DATABASE_URL,
        connect_args={
            "check_same_thread": False,
        },
        poolclass=StaticPool,
    )
    
    # Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    # Create session
    TestSessionLocal = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with TestSessionLocal() as session:
        yield session
    
    # Drop tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    await engine.dispose()


@pytest.fixture
async def client(test_db: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """Create a test client with database dependency override."""
    
    async def override_get_db():
        yield test_db
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
    
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Test user data for registration."""
    return {
        "email": "test@example.com",
        "password": "password123",
        "password_confirm": "password123",
        "first_name": "Test",
        "last_name": "User",
        "accept_terms": True
    }


@pytest.fixture
def test_login_data():
    """Test login data."""
    return {
        "email": "test@example.com",
        "password": "password123",
        "remember_me": False
    }


@pytest.fixture
def test_portfolio_data():
    """Test portfolio data."""
    return {
        "name": "Test Portfolio",
        "description": "A test portfolio",
        "currency": "USD"
    }


@pytest.fixture
def test_asset_data():
    """Test asset data."""
    return {
        "symbol": "AAPL",
        "quantity": 10.0,
        "price": 150.00,
        "notes": "Test purchase"
    }


@pytest.fixture
def test_transaction_data():
    """Test transaction data."""
    from datetime import datetime
    return {
        "transaction_type": "buy",
        "symbol": "AAPL",
        "quantity": 5.0,
        "price": 150.00,
        "fees": 1.00,
        "transaction_date": datetime.now().isoformat(),
        "notes": "Test transaction"
    }


@pytest.fixture
async def test_user(test_db):
    """Create a test user in the database."""
    from app.db.models import User
    
    user = User(
        email="test@example.com",
        password_hash="hashed_password",
        first_name="Test",
        last_name="User"
    )
    
    test_db.add(user)
    await test_db.commit()
    await test_db.refresh(user)
    
    return user


@pytest.fixture
async def test_portfolio(test_db, test_user):
    """Create a test portfolio in the database."""
    from app.db.models import Portfolio
    
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Portfolio",
        description="Test Description",
        currency="USD"
    )
    
    test_db.add(portfolio)
    await test_db.commit()
    await test_db.refresh(portfolio)
    
    return portfolio


@pytest.fixture
async def test_asset(test_db, test_portfolio):
    """Create a test asset in the database."""
    from app.db.models import Asset, AssetType
    from decimal import Decimal
    
    asset = Asset(
        portfolio_id=test_portfolio.id,
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
    
    return asset