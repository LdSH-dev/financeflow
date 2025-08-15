"""
Portfolio Service
Business logic for portfolio management
"""

from decimal import Decimal
from typing import List, Optional
from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.db.models import Portfolio, Asset, Transaction, User, TransactionType, AssetType
from app.schemas.portfolio import (
    PortfolioCreate, PortfolioUpdate, PortfolioResponse, PortfolioSummary,
    AssetCreate, AssetUpdate, AssetResponse, 
    TransactionCreate, TransactionResponse,
    AssetAllocation, PerformanceData
)


class PortfolioService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_portfolios(self, user_id: str, include_assets: bool = False) -> List[Portfolio]:
        """Get all portfolios for a user"""
        query = select(Portfolio).where(Portfolio.user_id == user_id)
        
        if include_assets:
            query = query.options(selectinload(Portfolio.assets))
        
        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_portfolio(
        self, 
        portfolio_id: str, 
        user_id: str, 
        include_assets: bool = False
    ) -> Optional[Portfolio]:
        """Get a specific portfolio"""
        query = select(Portfolio).where(
            Portfolio.id == portfolio_id,
            Portfolio.user_id == user_id
        )
        
        if include_assets:
            query = query.options(selectinload(Portfolio.assets))
        
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_portfolio(self, user_id: str, portfolio_data: PortfolioCreate) -> Portfolio:
        """Create a new portfolio"""
        # Check if portfolio name already exists for user
        existing_query = select(Portfolio).where(
            Portfolio.user_id == user_id,
            Portfolio.name == portfolio_data.name
        )
        existing_result = await self.db.execute(existing_query)
        existing_portfolio = existing_result.scalar_one_or_none()
        
        if existing_portfolio:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Portfolio with this name already exists"
            )

        # Create portfolio
        portfolio = Portfolio(
            user_id=user_id,
            name=portfolio_data.name,
            description=portfolio_data.description,
            currency=portfolio_data.currency
        )

        self.db.add(portfolio)
        await self.db.commit()
        await self.db.refresh(portfolio)
        
        return portfolio

    async def update_portfolio(
        self, 
        portfolio_id: str, 
        user_id: str, 
        portfolio_data: PortfolioUpdate
    ) -> Optional[Portfolio]:
        """Update a portfolio"""
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        
        if not portfolio:
            return None

        # Check name uniqueness if name is being updated
        if portfolio_data.name and portfolio_data.name != portfolio.name:
            existing_query = select(Portfolio).where(
                Portfolio.user_id == user_id,
                Portfolio.name == portfolio_data.name,
                Portfolio.id != portfolio_id
            )
            existing_result = await self.db.execute(existing_query)
            existing_portfolio = existing_result.scalar_one_or_none()
            
            if existing_portfolio:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Portfolio with this name already exists"
                )

        # Update fields
        update_data = portfolio_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(portfolio, field, value)

        await self.db.commit()
        await self.db.refresh(portfolio)
        
        return portfolio

    async def delete_portfolio(self, portfolio_id: str, user_id: str) -> bool:
        """Delete a portfolio"""
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        
        if not portfolio:
            return False

        await self.db.delete(portfolio)
        await self.db.commit()
        
        return True

    async def add_asset(
        self, 
        portfolio_id: str, 
        user_id: str, 
        asset_data: AssetCreate
    ) -> Asset:
        """Add an asset to a portfolio"""
        # Verify portfolio ownership
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portfolio not found"
            )

        # Check if asset already exists in portfolio
        existing_query = select(Asset).where(
            Asset.portfolio_id == portfolio_id,
            Asset.symbol == asset_data.symbol.upper()
        )
        existing_result = await self.db.execute(existing_query)
        existing_asset = existing_result.scalar_one_or_none()

        if existing_asset:
            # Instead of throwing an error, update the existing asset
            old_total_cost = existing_asset.total_cost
            new_purchase_cost = asset_data.quantity * asset_data.price
            
            
            
            existing_asset.quantity += asset_data.quantity
            existing_asset.total_cost += new_purchase_cost
            existing_asset.average_cost = existing_asset.total_cost / existing_asset.quantity
            
    
            
            # Update current price to the latest purchase price and recalculate market value
            existing_asset.current_price = asset_data.price
            existing_asset.market_value = existing_asset.quantity * existing_asset.current_price
            
            # Create transaction for the additional purchase
            transaction_date = datetime.utcnow()
            if asset_data.transaction_date:
                if isinstance(asset_data.transaction_date, str):
                    transaction_date = datetime.fromisoformat(asset_data.transaction_date + "T00:00:00")
                elif hasattr(asset_data.transaction_date, 'date'):
                    transaction_date = datetime.combine(asset_data.transaction_date, datetime.min.time())
                else:
                    transaction_date = asset_data.transaction_date

            transaction = Transaction(
                portfolio_id=portfolio_id,
                asset_id=existing_asset.id,
                transaction_type=TransactionType.BUY,
                symbol=asset_data.symbol.upper(),
                quantity=asset_data.quantity,
                price=asset_data.price,
                total_amount=new_purchase_cost,
                transaction_date=transaction_date,
                notes=asset_data.notes
            )

            self.db.add(transaction)
            
            # Commit the transaction first to ensure it's saved
            await self.db.commit()
            
            # Recalculate asset totals based on all transactions to ensure accuracy
            from app.services.transaction_service import TransactionService
            transaction_service = TransactionService(self.db)
            await transaction_service._recalculate_asset_totals(existing_asset)
            

            
            # Update portfolio totals after adding asset
            await self._update_portfolio_totals(portfolio_id)
            await self.db.commit()
            
            # Refresh the asset to ensure it's still attached to the session
            await self.db.refresh(existing_asset)
            
            return existing_asset

        # Create asset
        total_cost = asset_data.quantity * asset_data.price
        
        # Determine asset type from symbol
        asset_type = self._determine_asset_type(asset_data.symbol)
        
        asset = Asset(
            portfolio_id=portfolio_id,
            symbol=asset_data.symbol.upper(),
            name=asset_data.symbol.upper(),
            asset_type=asset_type,
            quantity=asset_data.quantity,
            average_cost=asset_data.price,
            current_price=asset_data.price,
            market_value=total_cost,
            total_cost=total_cost
        )

        self.db.add(asset)
        await self.db.flush()  # Flush to get the asset ID without committing
        await self.db.refresh(asset)  # Refresh to get the generated ID

        # Convert transaction_date if provided
        transaction_date = datetime.utcnow()
        if asset_data.transaction_date:
            if isinstance(asset_data.transaction_date, str):
                # Parse date string (YYYY-MM-DD format) and set to start of day
                transaction_date = datetime.fromisoformat(asset_data.transaction_date + "T00:00:00")
            elif hasattr(asset_data.transaction_date, 'date'):
                # It's a date object, convert to datetime at start of day
                transaction_date = datetime.combine(asset_data.transaction_date, datetime.min.time())
            else:
                # It's already a datetime
                transaction_date = asset_data.transaction_date

        # Create initial transaction
        transaction = Transaction(
            portfolio_id=portfolio_id,
            asset_id=asset.id,
            transaction_type=TransactionType.BUY,
            symbol=asset_data.symbol.upper(),
            quantity=asset_data.quantity,
            price=asset_data.price,
            total_amount=total_cost,
            transaction_date=transaction_date,
            notes=asset_data.notes
        )

        self.db.add(transaction)
        
        # Update portfolio totals after adding asset
        await self._update_portfolio_totals(portfolio_id)
        await self.db.commit()
        
        # Refresh the asset to ensure it's still attached to the session
        await self.db.refresh(asset)
        
        return asset

    async def update_asset(
        self, 
        portfolio_id: str, 
        asset_id: str, 
        user_id: str, 
        asset_data: AssetUpdate
    ) -> Optional[Asset]:
        """Update an asset"""
        # Verify portfolio ownership
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            return None

        # Get asset
        query = select(Asset).where(
            Asset.id == asset_id,
            Asset.portfolio_id == portfolio_id
        )
        result = await self.db.execute(query)
        asset = result.scalar_one_or_none()

        if not asset:
            return None

        # Store original quantity to detect changes
        original_quantity = asset.quantity
        
        # Update fields
        update_data = asset_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(asset, field, value)

        # Recalculate market value if quantity or current_price changed
        if "quantity" in update_data or "current_price" in update_data:
            asset.market_value = asset.quantity * asset.current_price

        # Create transaction if quantity changed
        if "quantity" in update_data and asset.quantity != original_quantity:
            await self._create_transaction_from_quantity_change(
                asset, original_quantity, asset.quantity
            )

        # Update portfolio totals after updating asset
        await self._update_portfolio_totals(portfolio_id)
        await self.db.commit()
        await self.db.refresh(asset)
        
        return asset

    async def remove_asset(
        self, 
        portfolio_id: str, 
        asset_id: str, 
        user_id: str
    ) -> bool:
        """Remove an asset from a portfolio"""
        # Verify portfolio ownership
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        if not portfolio:
            return False

        # Get asset
        query = select(Asset).where(
            Asset.id == asset_id,
            Asset.portfolio_id == portfolio_id
        )
        result = await self.db.execute(query)
        asset = result.scalar_one_or_none()

        if not asset:
            return False

        await self.db.delete(asset)
        
        # Update portfolio totals after removing asset
        await self._update_portfolio_totals(portfolio_id)
        await self.db.commit()
        
        return True

    async def get_portfolio_allocation(self, portfolio_id: str, user_id: str) -> List[AssetAllocation]:
        """Get portfolio asset allocation"""
        portfolio = await self.get_portfolio(portfolio_id, user_id, include_assets=True)
        
        if not portfolio:
            return []

        # Calculate allocation by asset type
        allocation_map = {}
        total_value = portfolio.total_value

        for asset in portfolio.assets:
            asset_type = asset.asset_type
            if asset_type not in allocation_map:
                allocation_map[asset_type] = Decimal("0.00")
            allocation_map[asset_type] += asset.market_value

        # Convert to allocation objects
        allocations = []
        for asset_type, value in allocation_map.items():
            percentage = (value / total_value * 100) if total_value > 0 else Decimal("0.00")
            allocations.append(AssetAllocation(
                asset_type=asset_type,
                value=value,
                percentage=percentage
            ))

        return allocations

    async def calculate_portfolio_performance(
        self,
        portfolio_id: str,
        user_id: str
    ) -> Optional[PerformanceData]:
        """Calculate portfolio performance metrics"""
        portfolio = await self.get_portfolio(portfolio_id, user_id)
        
        if not portfolio:
            return None

        # Basic performance calculation
        total_return = portfolio.total_value - portfolio.total_cost
        total_return_percent = (
            (total_return / portfolio.total_cost * 100) 
            if portfolio.total_cost > 0 
            else Decimal("0.00")
        )

        # TODO: Implement more sophisticated performance calculations
        # - Annualized return
        # - Volatility
        # - Sharpe ratio
        # - Maximum drawdown
        # - Time-period specific returns

        return PerformanceData(
            total_return=total_return,
            total_return_percent=total_return_percent,
            annualized_return=Decimal("0.00"),  # Placeholder
            volatility=Decimal("0.00"),  # Placeholder
            sharpe_ratio=Decimal("0.00"),  # Placeholder
            max_drawdown=Decimal("0.00")  # Placeholder
        )

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
        total_unrealized_gain_loss = total_value - total_cost



        # Update portfolio
        portfolio.total_value = total_value
        portfolio.total_cost = total_cost
        
        # Update portfolio day change (for now, equals unrealized gain/loss)
        portfolio.day_change = total_unrealized_gain_loss
        
        # Calculate portfolio day change percentage
        if total_cost > 0:
            portfolio.day_change_percent = (total_unrealized_gain_loss / total_cost) * 100
        else:
            portfolio.day_change_percent = Decimal("0.00")

        # Calculate weights and gains/losses for assets
        for asset in portfolio.assets:
            if total_value > 0:
                asset.weight = (asset.market_value / total_value) * 100
            else:
                asset.weight = Decimal("0.00")
            
            # Calculate unrealized gain/loss (market value - total cost)
            asset.unrealized_gain_loss = asset.market_value - asset.total_cost
            
            # For now, day_change equals unrealized_gain_loss
            # TODO: Implement proper day change calculation based on previous day's price
            asset.day_change = asset.unrealized_gain_loss
            
            # Calculate day change percentage
            if asset.total_cost > 0:
                asset.day_change_percent = (asset.unrealized_gain_loss / asset.total_cost) * 100
            else:
                asset.day_change_percent = Decimal("0.00")
            

        
        # Note: Commit is handled by the calling function

    def _determine_asset_type(self, symbol: str) -> AssetType:
        """Determine asset type from symbol"""
        symbol = symbol.upper()
        
        # Common crypto symbols
        crypto_symbols = {
            'BTC', 'ETH', 'ADA', 'DOT', 'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'ATOM',
            'XRP', 'LTC', 'BCH', 'EOS', 'TRX', 'XLM', 'ALGO', 'VET', 'FIL', 'THETA',
            'AAVE', 'MKR', 'COMP', 'YFI', 'SNX', 'CRV', 'BAL', 'SUSHI', '1INCH', 'ENJ',
            'MANA', 'SAND', 'AXS', 'SHIB', 'DOGE', 'ICP', 'NEAR', 'FTT', 'LUNA', 'UST'
        }
        
        # ETF patterns (usually end with specific suffixes)
        if any(symbol.endswith(suffix) for suffix in ['ETF', 'SPDR', 'IVV', 'VOO', 'VTI', 'QQQ']):
            return AssetType.ETF
        
        # Bond patterns
        if any(pattern in symbol for pattern in ['BOND', 'TLT', 'IEF', 'SHY', 'AGG']):
            return AssetType.BOND
        
        # Commodity patterns
        if any(pattern in symbol for pattern in ['GLD', 'SLV', 'OIL', 'GAS', 'GOLD', 'SILVER']):
            return AssetType.COMMODITY
        
        # Real estate patterns
        if any(pattern in symbol for pattern in ['REIT', 'VNQ', 'SCHH', 'IYR']):
            return AssetType.REAL_ESTATE
        
        # Cash equivalents
        if any(pattern in symbol for pattern in ['CASH', 'USD', 'EUR', 'GBP', 'JPY']):
            return AssetType.CASH
        
        # Check if it's a known crypto
        if symbol in crypto_symbols:
            return AssetType.CRYPTO
        
        # Default to stock for traditional stock symbols
        return AssetType.STOCK

    async def get_recent_activities(self, user_id: str, limit: int = 10) -> List[dict]:
        """Get recent activities based on transactions and portfolio changes"""
        from datetime import datetime, timedelta
        
        # Get recent transactions (last 30 days)
        recent_date = datetime.utcnow() - timedelta(days=30)
        
        query = select(Transaction).join(Portfolio).where(
            Portfolio.user_id == user_id,
            Transaction.transaction_date >= recent_date
        ).options(
            selectinload(Transaction.portfolio),
            selectinload(Transaction.asset)
        ).order_by(Transaction.transaction_date.desc()).limit(limit)
        
        result = await self.db.execute(query)
        transactions = result.scalars().all()
        
        activities = []
        for transaction in transactions:
            # Map transaction to activity
            activity = {
                "id": transaction.id,
                "type": transaction.transaction_type.value,  # 'buy', 'sell', 'dividend'
                "symbol": transaction.symbol,
                "quantity": float(transaction.quantity),
                "price": float(transaction.price),
                "total_amount": float(transaction.total_amount),
                "portfolio_name": transaction.portfolio.name,
                "timestamp": transaction.transaction_date.isoformat(),
                "description": self._generate_activity_description(transaction)
            }
            activities.append(activity)
        
        return activities
    
    def _generate_activity_description(self, transaction: Transaction) -> str:
        """Generate human-readable description for transaction"""
        quantity = int(transaction.quantity) if transaction.quantity == int(transaction.quantity) else float(transaction.quantity)
        
        if transaction.transaction_type == TransactionType.BUY:
            return f"Purchased {quantity} shares of {transaction.symbol}"
        elif transaction.transaction_type == TransactionType.SELL:
            return f"Sold {quantity} shares of {transaction.symbol}"
        elif transaction.transaction_type == TransactionType.DIVIDEND:
            return f"Dividend received from {transaction.symbol}"
        elif transaction.transaction_type == TransactionType.SPLIT:
            return f"Stock split for {transaction.symbol}"
        else:
            return f"Transaction for {transaction.symbol}"
    
    async def _create_transaction_from_quantity_change(
        self, 
        asset: Asset, 
        original_quantity: Decimal, 
        new_quantity: Decimal
    ):
        """Create a transaction based on quantity change"""
        quantity_diff = new_quantity - original_quantity
        
        if quantity_diff == 0:
            return  # No change
        
        # Determine transaction type and quantity
        if quantity_diff > 0:
            # Increase = BUY
            transaction_type = TransactionType.BUY
            transaction_quantity = quantity_diff
        else:
            # Decrease = SELL
            transaction_type = TransactionType.SELL
            transaction_quantity = abs(quantity_diff)
        
        # Calculate total amount
        total_amount = transaction_quantity * asset.current_price
        
        # Create transaction
        transaction = Transaction(
            portfolio_id=asset.portfolio_id,
            asset_id=asset.id,
            transaction_type=transaction_type,
            symbol=asset.symbol,
            quantity=transaction_quantity,
            price=asset.current_price,
            total_amount=total_amount,
            transaction_date=datetime.utcnow(),
            notes=f"Auto-generated from asset quantity change"
        )
        
        self.db.add(transaction)
        await self.db.flush()  # Ensure transaction is saved