"""
Tests for portfolio endpoints
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.portfolio_service import PortfolioService


class TestPortfolioEndpoints:
    """Test portfolio API endpoints."""

    async def test_create_portfolio_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test successful portfolio creation."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        
        assert response.status_code == 201
        data = response.json()
        
        assert data["name"] == test_portfolio_data["name"]
        assert data["description"] == test_portfolio_data["description"]
        assert data["currency"] == test_portfolio_data["currency"]
        assert float(data["totalValue"]) == 0.0
        assert float(data["totalCost"]) == 0.0
        assert "id" in data
        assert "createdAt" in data

    async def test_create_portfolio_duplicate_name(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test creating portfolio with duplicate name."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create first portfolio
        await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        
        # Try to create second portfolio with same name
        response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "Portfolio with this name already exists" in str(data)

    async def test_create_portfolio_unauthorized(
        self, 
        client: AsyncClient,
        test_portfolio_data: dict
    ):
        """Test creating portfolio without authentication."""
        response = await client.post("/api/v1/portfolios/", json=test_portfolio_data)
        
        assert response.status_code == 403

    async def test_get_portfolios_empty(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test getting portfolios when user has none."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Get portfolios
        response = await client.get("/api/v1/portfolios/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_get_portfolios_with_data(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test getting portfolios when user has portfolios."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        
        # Get portfolios
        response = await client.get("/api/v1/portfolios/", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == test_portfolio_data["name"]

    async def test_get_portfolio_by_id_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test getting specific portfolio by ID."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Get portfolio by ID
        response = await client.get(f"/api/v1/portfolios/{portfolio_id}", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == portfolio_id
        assert data["name"] == test_portfolio_data["name"]

    async def test_get_portfolio_not_found(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test getting non-existent portfolio."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Try to get non-existent portfolio
        response = await client.get("/api/v1/portfolios/non-existent-id", headers=headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "Portfolio not found" in str(data)

    async def test_update_portfolio_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test successful portfolio update."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Update portfolio
        update_data = {
            "name": "Updated Portfolio Name",
            "description": "Updated description"
        }
        response = await client.patch(
            f"/api/v1/portfolios/{portfolio_id}", 
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]
        assert data["description"] == update_data["description"]

    async def test_update_portfolio_not_found(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test updating non-existent portfolio."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Try to update non-existent portfolio
        update_data = {"name": "Updated Name"}
        response = await client.patch(
            "/api/v1/portfolios/non-existent-id", 
            json=update_data,
            headers=headers
        )
        
        assert response.status_code == 404
        data = response.json()
        assert "Portfolio not found" in str(data)

    async def test_delete_portfolio_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test successful portfolio deletion."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Delete portfolio
        response = await client.delete(f"/api/v1/portfolios/{portfolio_id}", headers=headers)
        
        assert response.status_code == 204
        
        # Verify portfolio is deleted
        get_response = await client.get(f"/api/v1/portfolios/{portfolio_id}", headers=headers)
        assert get_response.status_code == 404

    async def test_delete_portfolio_not_found(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test deleting non-existent portfolio."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Try to delete non-existent portfolio
        response = await client.delete("/api/v1/portfolios/non-existent-id", headers=headers)
        
        assert response.status_code == 404
        data = response.json()
        assert "Portfolio not found" in str(data)

    async def test_add_asset_to_portfolio_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict,
        test_asset_data: dict
    ):
        """Test successfully adding asset to portfolio."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Add asset
        response = await client.post(
            f"/api/v1/portfolios/{portfolio_id}/assets", 
            json=test_asset_data,
            headers=headers
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["symbol"] == test_asset_data["symbol"]
        assert float(data["quantity"]) == test_asset_data["quantity"]
        assert data["portfolioId"] == portfolio_id

    async def test_add_asset_portfolio_not_found(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_asset_data: dict
    ):
        """Test adding asset to non-existent portfolio."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Try to add asset to non-existent portfolio
        response = await client.post(
            "/api/v1/portfolios/non-existent-id/assets", 
            json=test_asset_data,
            headers=headers
        )
        
        assert response.status_code == 404

    async def test_get_recent_activities(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test getting recent activities."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Get recent activities
        response = await client.get("/api/v1/portfolios/recent-activities", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "data" in data
        assert "timestamp" in data

    async def test_get_portfolio_allocation(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test getting portfolio allocation."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Get allocation
        response = await client.get(f"/api/v1/portfolios/{portfolio_id}/allocation", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    async def test_get_portfolio_performance(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_portfolio_data: dict
    ):
        """Test getting portfolio performance."""
        # Register and login user
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        
        # Create portfolio
        create_response = await client.post(
            "/api/v1/portfolios/", 
            json=test_portfolio_data,
            headers=headers
        )
        portfolio_id = create_response.json()["id"]
        
        # Get performance
        response = await client.get(f"/api/v1/portfolios/{portfolio_id}/performance", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_return" in data or response.status_code == 404  # May not have performance data initially


class TestPortfolioService:
    """Test portfolio service methods."""

    async def test_create_portfolio_service(self, test_db: AsyncSession):
        """Test portfolio creation through service."""
        from app.schemas.portfolio import PortfolioCreate
        
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

    async def test_get_portfolios_service(self, test_db: AsyncSession):
        """Test getting portfolios through service."""
        from app.schemas.portfolio import PortfolioCreate
        
        service = PortfolioService(test_db)
        
        # Create portfolio first
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        await service.create_portfolio(user_id, portfolio_data)
        
        # Get portfolios
        portfolios = await service.get_portfolios(user_id)
        
        assert len(portfolios) == 1
        assert portfolios[0].name == "Test Portfolio"

    async def test_duplicate_portfolio_name_service(self, test_db: AsyncSession):
        """Test creating portfolio with duplicate name through service."""
        from app.schemas.portfolio import PortfolioCreate
        from fastapi import HTTPException
        
        service = PortfolioService(test_db)
        
        portfolio_data = PortfolioCreate(
            name="Test Portfolio",
            description="Test Description",
            currency="USD"
        )
        
        # Use a valid UUID format for user_id
        import uuid
        user_id = str(uuid.uuid4())
        
        # Create first portfolio
        await service.create_portfolio(user_id, portfolio_data)
        
        # Try to create second with same name
        with pytest.raises(HTTPException) as exc_info:
            await service.create_portfolio(user_id, portfolio_data)
        
        assert exc_info.value.status_code == 400
        assert "Portfolio with this name already exists" in str(exc_info.value.detail)