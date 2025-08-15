"""
Portfolio API endpoints
"""

import time
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.db.models import User
from app.services.portfolio_service import PortfolioService
from app.schemas.portfolio import (
    PortfolioCreate, PortfolioUpdate, PortfolioResponse, PortfolioSummary,
    AssetCreate, AssetUpdate, AssetResponse,
    TransactionCreate, TransactionResponse,
    AssetAllocation, PerformanceData
)
from app.api.v1.auth import get_current_user_dependency

router = APIRouter(prefix="/portfolios", tags=["portfolios"])


@router.get("/", response_model=List[PortfolioResponse])
async def get_portfolios(
    include_assets: bool = Query(False, description="Include assets in response"),
    include_performance: bool = Query(False, description="Include performance data"),
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get all portfolios for the current user"""
    service = PortfolioService(db)
    portfolios = await service.get_portfolios(current_user.id, include_assets)
    
    result = []
    for p in portfolios:
        # Get allocation if including assets
        allocation = []
        if include_assets:
            allocation = await service.get_portfolio_allocation(p.id, current_user.id)
        
        # Get performance if requested
        performance = None
        if include_performance:
            performance = await service.calculate_portfolio_performance(p.id, current_user.id)
        
        # Convert assets to response format
        assets_response = []
        if include_assets and p.assets:
            assets_response = [
                AssetResponse(
                    id=asset.id,
                    portfolio_id=asset.portfolio_id,
                    symbol=asset.symbol,
                    name=asset.name,
                    asset_type=asset.asset_type,
                    sector=asset.sector,
                    industry=asset.industry,
                    quantity=asset.quantity,
                    average_cost=asset.average_cost,
                    current_price=asset.current_price,
                    market_value=asset.market_value,
                    total_cost=asset.total_cost,
                    unrealized_gain_loss=asset.unrealized_gain_loss,
                    day_change=asset.day_change,
                    day_change_percent=asset.day_change_percent,
                    weight=asset.weight,
                    dividend_yield=asset.dividend_yield,
                    pe_ratio=asset.pe_ratio,
                    market_cap=asset.market_cap,
                    created_at=asset.created_at,
                    updated_at=asset.updated_at,
                    last_price_update=asset.last_price_update
                )
                for asset in p.assets
            ]
        
        result.append(PortfolioResponse(
            id=p.id,
            user_id=p.user_id,
            name=p.name,
            description=p.description,
            currency=p.currency,
            total_value=p.total_value,
            total_cost=p.total_cost,
            day_change=p.day_change,
            day_change_percent=p.day_change_percent,
            assets=assets_response,
            allocation=allocation,
            performance=performance,
            created_at=p.created_at,
            updated_at=p.updated_at
        ))
    
    return result


@router.post("/", response_model=PortfolioResponse, status_code=status.HTTP_201_CREATED)
async def create_portfolio(
    portfolio_data: PortfolioCreate,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Create a new portfolio"""
    service = PortfolioService(db)
    portfolio = await service.create_portfolio(current_user.id, portfolio_data)
    
    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        currency=portfolio.currency,
        total_value=portfolio.total_value,
        total_cost=portfolio.total_cost,
        day_change=portfolio.day_change,
        day_change_percent=portfolio.day_change_percent,
        assets=[],
        allocation=[],
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at
    )


@router.get("/recent-activities", response_model=dict)
async def get_recent_activities(
    limit: int = Query(10, ge=1, le=50, description="Number of activities to return"),
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get recent portfolio activities"""
    service = PortfolioService(db)
    activities = await service.get_recent_activities(current_user.id, limit)
    
    return {
        "success": True,
        "data": activities,
        "timestamp": time.time()
    }


@router.get("/{portfolio_id}", response_model=PortfolioResponse)
async def get_portfolio(
    portfolio_id: str,
    include_assets: bool = Query(True, description="Include assets in response"),
    include_performance: bool = Query(False, description="Include performance data"),
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific portfolio"""
    service = PortfolioService(db)
    portfolio = await service.get_portfolio(portfolio_id, current_user.id, include_assets)
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Get allocation
    allocation = await service.get_portfolio_allocation(portfolio_id, current_user.id)
    
    # Get performance if requested
    performance = None
    if include_performance:
        performance = await service.calculate_portfolio_performance(portfolio_id, current_user.id)
    
    # Convert assets to response format
    assets_response = []
    if include_assets and portfolio.assets:
        assets_response = [
            AssetResponse(
                id=asset.id,
                portfolio_id=asset.portfolio_id,
                symbol=asset.symbol,
                name=asset.name,
                asset_type=asset.asset_type,
                sector=asset.sector,
                industry=asset.industry,
                quantity=asset.quantity,
                average_cost=asset.average_cost,
                current_price=asset.current_price,
                market_value=asset.market_value,
                total_cost=asset.total_cost,
                unrealized_gain_loss=asset.unrealized_gain_loss,
                day_change=asset.day_change,
                day_change_percent=asset.day_change_percent,
                weight=asset.weight,
                dividend_yield=asset.dividend_yield,
                pe_ratio=asset.pe_ratio,
                market_cap=asset.market_cap,
                created_at=asset.created_at,
                updated_at=asset.updated_at,
                last_price_update=asset.last_price_update
            )
            for asset in portfolio.assets
        ]
    
    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        currency=portfolio.currency,
        total_value=portfolio.total_value,
        total_cost=portfolio.total_cost,
        day_change=portfolio.day_change,
        day_change_percent=portfolio.day_change_percent,
        assets=assets_response,
        allocation=allocation,
        performance=performance,
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at
    )


@router.patch("/{portfolio_id}", response_model=PortfolioResponse)
async def update_portfolio(
    portfolio_id: str,
    portfolio_data: PortfolioUpdate,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Update a portfolio"""
    service = PortfolioService(db)
    portfolio = await service.update_portfolio(portfolio_id, current_user.id, portfolio_data)
    
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return PortfolioResponse(
        id=portfolio.id,
        user_id=portfolio.user_id,
        name=portfolio.name,
        description=portfolio.description,
        currency=portfolio.currency,
        total_value=portfolio.total_value,
        total_cost=portfolio.total_cost,
        day_change=portfolio.day_change,
        day_change_percent=portfolio.day_change_percent,
        assets=[],
        allocation=[],
        created_at=portfolio.created_at,
        updated_at=portfolio.updated_at
    )


@router.delete("/{portfolio_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_portfolio(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Delete a portfolio"""
    service = PortfolioService(db)
    success = await service.delete_portfolio(portfolio_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )


@router.post("/{portfolio_id}/assets", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
async def add_asset(
    portfolio_id: str,
    asset_data: AssetCreate,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Add an asset to a portfolio"""

    
    try:
        service = PortfolioService(db)
        asset = await service.add_asset(portfolio_id, current_user.id, asset_data)

    except Exception as e:

        raise
    
    return AssetResponse(
        id=asset.id,
        portfolio_id=asset.portfolio_id,
        symbol=asset.symbol,
        name=asset.name,
        asset_type=asset.asset_type,
        sector=asset.sector,
        industry=asset.industry,
        quantity=asset.quantity,
        average_cost=asset.average_cost,
        current_price=asset.current_price,
        market_value=asset.market_value,
        total_cost=asset.total_cost,
        unrealized_gain_loss=asset.unrealized_gain_loss,
        day_change=asset.day_change,
        day_change_percent=asset.day_change_percent,
        weight=asset.weight,
        dividend_yield=asset.dividend_yield,
        pe_ratio=asset.pe_ratio,
        market_cap=asset.market_cap,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        last_price_update=asset.last_price_update
    )


@router.patch("/{portfolio_id}/assets/{asset_id}", response_model=AssetResponse)
async def update_asset(
    portfolio_id: str,
    asset_id: str,
    asset_data: AssetUpdate,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Update an asset"""
    service = PortfolioService(db)
    asset = await service.update_asset(portfolio_id, asset_id, current_user.id, asset_data)
    
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )
    
    return AssetResponse(
        id=asset.id,
        portfolio_id=asset.portfolio_id,
        symbol=asset.symbol,
        name=asset.name,
        asset_type=asset.asset_type,
        sector=asset.sector,
        industry=asset.industry,
        quantity=asset.quantity,
        average_cost=asset.average_cost,
        current_price=asset.current_price,
        market_value=asset.market_value,
        total_cost=asset.total_cost,
        unrealized_gain_loss=asset.unrealized_gain_loss,
        day_change=asset.day_change,
        day_change_percent=asset.day_change_percent,
        weight=asset.weight,
        dividend_yield=asset.dividend_yield,
        pe_ratio=asset.pe_ratio,
        market_cap=asset.market_cap,
        created_at=asset.created_at,
        updated_at=asset.updated_at,
        last_price_update=asset.last_price_update
    )


@router.delete("/{portfolio_id}/assets/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_asset(
    portfolio_id: str,
    asset_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Remove an asset from a portfolio"""
    service = PortfolioService(db)
    success = await service.remove_asset(portfolio_id, asset_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asset not found"
        )


@router.get("/{portfolio_id}/allocation", response_model=List[AssetAllocation])
async def get_portfolio_allocation(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio asset allocation"""
    service = PortfolioService(db)
    allocation = await service.get_portfolio_allocation(portfolio_id, current_user.id)
    return allocation


@router.get("/{portfolio_id}/performance", response_model=PerformanceData)
async def get_portfolio_performance(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get portfolio performance metrics"""
    service = PortfolioService(db)
    performance = await service.calculate_portfolio_performance(portfolio_id, current_user.id)
    
    if not performance:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    return performance


@router.post("/{portfolio_id}/recalculate-totals", status_code=status.HTTP_200_OK)
async def recalculate_portfolio_totals(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Recalculate portfolio totals (temporary endpoint for fixing existing data)"""
    service = PortfolioService(db)
    
    # Verify portfolio ownership
    portfolio = await service.get_portfolio(portfolio_id, current_user.id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Update portfolio totals
    await service._update_portfolio_totals(portfolio_id)
    await db.commit()
    
    return {"message": "Portfolio totals recalculated successfully"}


@router.post("/{portfolio_id}/fix-asset-types", status_code=status.HTTP_200_OK)
async def fix_asset_types(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Fix asset types for existing assets (temporary endpoint)"""
    service = PortfolioService(db)
    
    # Verify portfolio ownership
    portfolio = await service.get_portfolio(portfolio_id, current_user.id, include_assets=True)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Fix asset types for all assets
    for asset in portfolio.assets:
        correct_type = service._determine_asset_type(asset.symbol)
        if asset.asset_type != correct_type:
            asset.asset_type = correct_type
    
    await db.commit()
    
    return {"message": "Asset types fixed successfully"}


@router.post("/{portfolio_id}/recalculate-gains", status_code=status.HTTP_200_OK)
async def recalculate_gains(
    portfolio_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Recalculate gains/losses for portfolio (temporary endpoint)"""
    service = PortfolioService(db)
    
    # Verify portfolio ownership
    portfolio = await service.get_portfolio(portfolio_id, current_user.id)
    if not portfolio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Portfolio not found"
        )
    
    # Update portfolio totals (this will recalculate gains/losses)
    await service._update_portfolio_totals(portfolio_id)
    await db.commit()
    
    return {"message": "Gains/losses recalculated successfully"}