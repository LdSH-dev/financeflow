"""
Transaction Service
Business logic for transaction management
"""

from decimal import Decimal
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.db.models import Transaction, Portfolio, Asset, User, TransactionType
from app.schemas.portfolio import TransactionCreate, TransactionResponse


class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_transactions(
        self, 
        user_id: str,
        portfolio_id: Optional[str] = None,
        asset_id: Optional[str] = None,
        transaction_type: Optional[TransactionType] = None,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        page: int = 1,
        limit: int = 100
    ) -> List[Transaction]:
        """Get transactions with filters"""
        query = select(Transaction).join(Portfolio).where(Portfolio.user_id == user_id)
        
        # Apply filters
        if portfolio_id:
            query = query.where(Transaction.portfolio_id == portfolio_id)
        
        if asset_id:
            query = query.where(Transaction.asset_id == asset_id)
        
        if transaction_type:
            query = query.where(Transaction.transaction_type == transaction_type)
        
        if start_date:
            query = query.where(Transaction.transaction_date >= start_date)
        
        if end_date:
            query = query.where(Transaction.transaction_date <= end_date)
        
        # Order by date descending
        query = query.order_by(Transaction.transaction_date.desc())
        
        # Pagination
        offset = (page - 1) * limit
        query = query.offset(offset).limit(limit)
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_transaction(
        self, 
        transaction_id: str, 
        user_id: str
    ) -> Optional[Transaction]:
        """Get a specific transaction"""
        query = select(Transaction).join(Portfolio).where(
            and_(
                Transaction.id == transaction_id,
                Portfolio.user_id == user_id
            )
        )
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_transaction(
        self, 
        user_id: str, 
        transaction_data: TransactionCreate
    ) -> Transaction:
        """Create a new transaction"""
        # Verify asset ownership through portfolio
        asset_query = select(Asset).join(Portfolio).where(
            and_(
                Asset.id == transaction_data.asset_id,
                Portfolio.user_id == user_id
            )
        )
        asset_result = await self.db.execute(asset_query)
        asset = asset_result.scalar_one_or_none()
        
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found or you don't have permission"
            )

        # Calculate total amount
        total_amount = transaction_data.quantity * transaction_data.price
        if transaction_data.transaction_type == TransactionType.BUY:
            total_amount += transaction_data.fees
        else:  # SELL
            total_amount -= transaction_data.fees

        # Create transaction
        transaction = Transaction(
            portfolio_id=asset.portfolio_id,
            asset_id=transaction_data.asset_id,
            transaction_type=transaction_data.transaction_type,
            symbol=transaction_data.symbol.upper(),
            quantity=transaction_data.quantity,
            price=transaction_data.price,
            fees=transaction_data.fees,
            total_amount=total_amount,
            transaction_date=transaction_data.transaction_date,
            notes=transaction_data.notes
        )

        self.db.add(transaction)
        await self.db.commit()
        await self.db.refresh(transaction)

        # Update asset quantities and cost basis
        await self._update_asset_from_transaction(asset, transaction)
        
        return transaction

    async def update_transaction(
        self, 
        transaction_id: str, 
        user_id: str, 
        transaction_data: dict
    ) -> Optional[Transaction]:
        """Update a transaction"""
        transaction = await self.get_transaction(transaction_id, user_id)
        
        if not transaction:
            return None

        # Store old values for asset updates
        old_quantity = transaction.quantity
        old_price = transaction.price
        old_type = transaction.transaction_type

        # Update transaction fields
        for field, value in transaction_data.items():
            if hasattr(transaction, field):
                setattr(transaction, field, value)

        # Recalculate total amount
        transaction.total_amount = transaction.quantity * transaction.price
        if transaction.transaction_type == TransactionType.BUY:
            transaction.total_amount += transaction.fees
        else:
            transaction.total_amount -= transaction.fees

        await self.db.commit()
        await self.db.refresh(transaction)

        # Get asset and recalculate everything
        asset_query = select(Asset).where(Asset.id == transaction.asset_id)
        asset_result = await self.db.execute(asset_query)
        asset = asset_result.scalar_one_or_none()
        
        if asset:
            await self._recalculate_asset_totals(asset)
        
        return transaction

    async def delete_transaction(
        self, 
        transaction_id: str, 
        user_id: str
    ) -> bool:
        """Delete a transaction"""
        transaction = await self.get_transaction(transaction_id, user_id)
        
        if not transaction:
            return False

        # Get asset for recalculation
        asset_query = select(Asset).where(Asset.id == transaction.asset_id)
        asset_result = await self.db.execute(asset_query)
        asset = asset_result.scalar_one_or_none()

        await self.db.delete(transaction)
        await self.db.commit()

        # Recalculate asset totals
        if asset:
            await self._recalculate_asset_totals(asset)
        
        return True

    async def get_transaction_summary(
        self, 
        user_id: str, 
        portfolio_id: Optional[str] = None,
        period_days: int = 30
    ) -> dict:
        """Get transaction summary for a period"""
        start_date = datetime.utcnow() - timedelta(days=period_days)
        
        query = select(Transaction).join(Portfolio).where(
            and_(
                Portfolio.user_id == user_id,
                Transaction.transaction_date >= start_date
            )
        )
        
        if portfolio_id:
            query = query.where(Transaction.portfolio_id == portfolio_id)
        
        result = await self.db.execute(query)
        transactions = result.scalars().all()

        # Calculate summary
        total_buys = sum(
            t.total_amount for t in transactions 
            if t.transaction_type == TransactionType.BUY
        )
        total_sells = sum(
            t.total_amount for t in transactions 
            if t.transaction_type == TransactionType.SELL
        )
        total_fees = sum(t.fees for t in transactions)
        
        return {
            "period_days": period_days,
            "total_transactions": len(transactions),
            "total_buys": total_buys,
            "total_sells": total_sells,
            "net_flow": total_buys - total_sells,
            "total_fees": total_fees,
            "buy_transactions": len([t for t in transactions if t.transaction_type == TransactionType.BUY]),
            "sell_transactions": len([t for t in transactions if t.transaction_type == TransactionType.SELL])
        }

    async def _update_asset_from_transaction(self, asset: Asset, transaction: Transaction):
        """Update asset based on transaction"""
        if transaction.transaction_type == TransactionType.BUY:
            # Add to position
            old_cost = asset.quantity * asset.average_cost
            new_cost = transaction.quantity * transaction.price
            
            asset.quantity += transaction.quantity
            asset.total_cost = old_cost + new_cost
            asset.average_cost = asset.total_cost / asset.quantity if asset.quantity > 0 else Decimal("0.00")
            
        elif transaction.transaction_type == TransactionType.SELL:
            # Reduce position
            if transaction.quantity > asset.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot sell more shares than owned"
                )
            
            # Calculate cost basis for sold shares
            sold_cost = transaction.quantity * asset.average_cost
            asset.quantity -= transaction.quantity
            asset.total_cost -= sold_cost

        # Update market value
        asset.market_value = asset.quantity * asset.current_price
        
        # Update portfolio totals
        await self._update_portfolio_totals(asset.portfolio_id)
        
        await self.db.commit()

    async def _recalculate_asset_totals(self, asset: Asset):
        """Recalculate asset totals from all transactions"""
        # Get all transactions for this asset
        query = select(Transaction).where(
            Transaction.asset_id == asset.id
        ).order_by(Transaction.transaction_date)
        
        result = await self.db.execute(query)
        transactions = result.scalars().all()

        # Reset asset quantities
        total_quantity = Decimal("0.00")
        total_cost = Decimal("0.00")

        # Process transactions in chronological order
        for transaction in transactions:
            if transaction.transaction_type == TransactionType.BUY:
                total_quantity += transaction.quantity
                total_cost += transaction.quantity * transaction.price
            elif transaction.transaction_type == TransactionType.SELL:
                if transaction.quantity > total_quantity:
                    # This shouldn't happen, but handle gracefully
                    continue
                
                # Calculate average cost at time of sale
                avg_cost = total_cost / total_quantity if total_quantity > 0 else Decimal("0.00")
                sold_cost = transaction.quantity * avg_cost
                
                total_quantity -= transaction.quantity
                total_cost -= sold_cost

        # Update asset
        asset.quantity = total_quantity
        asset.total_cost = total_cost
        asset.average_cost = total_cost / total_quantity if total_quantity > 0 else Decimal("0.00")
        asset.market_value = total_quantity * asset.current_price
        
        # Update portfolio totals
        await self._update_portfolio_totals(asset.portfolio_id)
        
        await self.db.commit()

    async def _update_portfolio_totals(self, portfolio_id: str):
        """Update portfolio total values based on assets"""
        # Get portfolio with assets
        query = select(Portfolio).where(Portfolio.id == portfolio_id).options(
            selectinload(Portfolio.assets)
        )
        result = await self.db.execute(query)
        portfolio = result.scalar_one_or_none()

        if not portfolio:
            return

        # Calculate totals
        total_value = sum(asset.market_value for asset in portfolio.assets)
        total_cost = sum(asset.total_cost for asset in portfolio.assets)

        # Update portfolio
        portfolio.total_value = total_value
        portfolio.total_cost = total_cost

        # Calculate weights for assets
        for asset in portfolio.assets:
            if total_value > 0:
                asset.weight = (asset.market_value / total_value) * 100
            else:
                asset.weight = Decimal("0.00")
        
        # Note: Commit is handled by the calling function