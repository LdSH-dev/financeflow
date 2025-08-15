"""
Tests for authentication endpoints
"""

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.auth_service import AuthService


class TestAuthEndpoints:
    """Test authentication API endpoints."""

    async def test_register_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test successful user registration."""
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 201
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert data["user"]["email"] == test_user_data["email"]
        # Use camelCase as per the schema configuration
        assert data["user"]["firstName"] == test_user_data["first_name"]
        assert data["user"]["lastName"] == test_user_data["last_name"]
        assert "access_token" in data["tokens"]
        assert "refresh_token" in data["tokens"]

    async def test_register_duplicate_email(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test registration with duplicate email."""
        # First registration
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Second registration with same email
        response = await client.post("/api/v1/auth/register", json=test_user_data)
        
        assert response.status_code == 400
        data = response.json()
        assert "Email already registered" in str(data)



    async def test_login_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict,
        test_login_data: dict
    ):
        """Test successful login."""
        # Register user first
        await client.post("/api/v1/auth/register", json=test_user_data)
        
        # Login
        response = await client.post("/api/v1/auth/login", json=test_login_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "user" in data
        assert "tokens" in data
        assert data["user"]["email"] == test_login_data["email"]
        assert "access_token" in data["tokens"]

    async def test_login_invalid_credentials(
        self, 
        client: AsyncClient,
        test_login_data: dict
    ):
        """Test login with invalid credentials."""
        test_login_data["password"] = "wrong_password"
        
        response = await client.post("/api/v1/auth/login", json=test_login_data)
        
        assert response.status_code == 401
        data = response.json()
        assert "Incorrect email or password" in str(data)

    async def test_get_current_user(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test getting current user information."""
        # Register and login
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        
        # Get current user
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["email"] == test_user_data["email"]
        assert data["firstName"] == test_user_data["first_name"]
        assert data["lastName"] == test_user_data["last_name"]

    async def test_get_current_user_invalid_token(self, client: AsyncClient):
        """Test getting current user with invalid token."""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await client.get("/api/v1/auth/me", headers=headers)
        
        assert response.status_code == 401

    async def test_refresh_token_success(
        self, 
        client: AsyncClient, 
        test_user_data: dict
    ):
        """Test successful token refresh."""
        # Register and get tokens
        login_response = await client.post("/api/v1/auth/register", json=test_user_data)
        tokens = login_response.json()["tokens"]
        
        # Refresh token
        refresh_data = {"refresh_token": tokens["refresh_token"]}
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "access_token" in data
        assert "refresh_token" in data
        # Note: tokens might be the same in test environment

    async def test_refresh_token_invalid(self, client: AsyncClient):
        """Test token refresh with invalid token."""
        refresh_data = {"refresh_token": "invalid_token"}
        response = await client.post("/api/v1/auth/refresh", json=refresh_data)
        
        assert response.status_code == 401

    async def test_logout(self, client: AsyncClient):
        """Test logout endpoint."""
        response = await client.post("/api/v1/auth/logout")
        
        assert response.status_code == 200
        data = response.json()
        assert "Successfully logged out" in data["message"]


class TestAuthService:
    """Test authentication service methods."""

    async def test_password_hashing(self, test_db: AsyncSession):
        """Test password hashing and verification."""
        auth_service = AuthService(test_db)
        
        password = "test_password"
        hashed = auth_service.get_password_hash(password)
        
        assert hashed != password
        assert auth_service.verify_password(password, hashed)
        assert not auth_service.verify_password("wrong_password", hashed)

    async def test_token_creation_and_verification(self, test_db: AsyncSession):
        """Test JWT token creation and verification."""
        auth_service = AuthService(test_db)
        
        data = {"sub": "user_id", "email": "test@example.com"}
        
        # Test access token
        access_token = auth_service.create_access_token(data)
        payload = auth_service.verify_token(access_token, "access")
        
        assert payload is not None
        assert payload["sub"] == data["sub"]
        assert payload["email"] == data["email"]
        assert payload["type"] == "access"
        
        # Test refresh token
        refresh_token = auth_service.create_refresh_token(data)
        payload = auth_service.verify_token(refresh_token, "refresh")
        
        assert payload is not None
        assert payload["sub"] == data["sub"]
        assert payload["type"] == "refresh"

    async def test_invalid_token_verification(self, test_db: AsyncSession):
        """Test verification of invalid tokens."""
        auth_service = AuthService(test_db)
        
        # Invalid token
        assert auth_service.verify_token("invalid_token", "access") is None
        
        # Wrong token type
        data = {"sub": "user_id"}
        access_token = auth_service.create_access_token(data)
        assert auth_service.verify_token(access_token, "refresh") is None