"""
Main API router for v1
"""

from fastapi import APIRouter
from app.api.v1 import auth, portfolios, transactions

api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router)
api_router.include_router(portfolios.router)
api_router.include_router(transactions.router)