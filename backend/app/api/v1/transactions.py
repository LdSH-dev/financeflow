"""
Transaction API endpoints
"""

from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.db.models import User, TransactionType
from app.services.transaction_service import TransactionService
from app.schemas.portfolio import TransactionCreate, TransactionResponse
from app.api.v1.auth import get_current_user_dependency

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("/", response_model=List[TransactionResponse])
async def get_transactions(
    portfolio_id: Optional[str] = Query(None, description="Filter by portfolio ID"),
    asset_id: Optional[str] = Query(None, description="Filter by asset ID"),
    transaction_type: Optional[TransactionType] = Query(None, description="Filter by transaction type"),
    start_date: Optional[datetime] = Query(None, description="Start date filter"),
    end_date: Optional[datetime] = Query(None, description="End date filter"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(100, ge=1, le=1000, description="Items per page"),
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get transactions with optional filters"""
    service = TransactionService(db)
    transactions = await service.get_transactions(
        user_id=current_user.id,
        portfolio_id=portfolio_id,
        asset_id=asset_id,
        transaction_type=transaction_type,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit
    )
    
    return [
        TransactionResponse(
            id=t.id,
            portfolio_id=t.portfolio_id,
            asset_id=t.asset_id,
            transaction_type=t.transaction_type,
            symbol=t.symbol,
            quantity=t.quantity,
            price=t.price,
            fees=t.fees,
            total_amount=t.total_amount,
            transaction_date=t.transaction_date,
            notes=t.notes,
            created_at=t.created_at
        )
        for t in transactions
    ]


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Create a new transaction"""
    service = TransactionService(db)
    transaction = await service.create_transaction(current_user.id, transaction_data)
    
    return TransactionResponse(
        id=transaction.id,
        portfolio_id=transaction.portfolio_id,
        asset_id=transaction.asset_id,
        transaction_type=transaction.transaction_type,
        symbol=transaction.symbol,
        quantity=transaction.quantity,
        price=transaction.price,
        fees=transaction.fees,
        total_amount=transaction.total_amount,
        transaction_date=transaction.transaction_date,
        notes=transaction.notes,
        created_at=transaction.created_at
    )


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific transaction"""
    service = TransactionService(db)
    transaction = await service.get_transaction(transaction_id, current_user.id)
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse(
        id=transaction.id,
        portfolio_id=transaction.portfolio_id,
        asset_id=transaction.asset_id,
        transaction_type=transaction.transaction_type,
        symbol=transaction.symbol,
        quantity=transaction.quantity,
        price=transaction.price,
        fees=transaction.fees,
        total_amount=transaction.total_amount,
        transaction_date=transaction.transaction_date,
        notes=transaction.notes,
        created_at=transaction.created_at
    )


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: str,
    transaction_data: dict,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Update a transaction"""
    service = TransactionService(db)
    transaction = await service.update_transaction(
        transaction_id, 
        current_user.id, 
        transaction_data
    )
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return TransactionResponse(
        id=transaction.id,
        portfolio_id=transaction.portfolio_id,
        asset_id=transaction.asset_id,
        transaction_type=transaction.transaction_type,
        symbol=transaction.symbol,
        quantity=transaction.quantity,
        price=transaction.price,
        fees=transaction.fees,
        total_amount=transaction.total_amount,
        transaction_date=transaction.transaction_date,
        notes=transaction.notes,
        created_at=transaction.created_at
    )


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: str,
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Delete a transaction"""
    service = TransactionService(db)
    success = await service.delete_transaction(transaction_id, current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )


@router.get("/summary/stats")
async def get_transaction_summary(
    portfolio_id: Optional[str] = Query(None, description="Filter by portfolio ID"),
    period_days: int = Query(30, ge=1, le=365, description="Period in days"),
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Get transaction summary statistics"""
    service = TransactionService(db)
    summary = await service.get_transaction_summary(
        user_id=current_user.id,
        portfolio_id=portfolio_id,
        period_days=period_days
    )
    
    return summary


@router.post("/bulk", response_model=List[TransactionResponse])
async def create_bulk_transactions(
    transactions_data: List[TransactionCreate],
    current_user: User = Depends(get_current_user_dependency),
    db: AsyncSession = Depends(get_db)
):
    """Create multiple transactions at once"""
    service = TransactionService(db)
    created_transactions = []
    
    for transaction_data in transactions_data:
        try:
            transaction = await service.create_transaction(current_user.id, transaction_data)
            created_transactions.append(TransactionResponse(
                id=transaction.id,
                portfolio_id=transaction.portfolio_id,
                asset_id=transaction.asset_id,
                transaction_type=transaction.transaction_type,
                symbol=transaction.symbol,
                quantity=transaction.quantity,
                price=transaction.price,
                fees=transaction.fees,
                total_amount=transaction.total_amount,
                transaction_date=transaction.transaction_date,
                notes=transaction.notes,
                created_at=transaction.created_at
            ))
        except Exception as e:
            # Log error but continue with other transactions
    
            continue
    
    return created_transactions