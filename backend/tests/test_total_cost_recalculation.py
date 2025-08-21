"""
Test total cost recalculation when asset quantity is changed
"""

import pytest
from decimal import Decimal
from datetime import datetime

from app.db.models import User, Portfolio, Asset, Transaction, TransactionType, AssetType
from app.services.portfolio_service import PortfolioService
from app.services.transaction_service import TransactionService


@pytest.mark.asyncio
async def test_total_cost_recalculation_on_quantity_change(db_session, test_user):
    """Test that total_cost is recalculated correctly when asset quantity is changed"""
    
    # Create portfolio
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Portfolio",
        description="Test portfolio for total cost recalculation"
    )
    db_session.add(portfolio)
    await db_session.commit()
    await db_session.refresh(portfolio)
    
    # Create asset
    asset = Asset(
        portfolio_id=portfolio.id,
        symbol="BTC",
        name="Bitcoin",
        asset_type=AssetType.CRYPTO,
        quantity=Decimal("100.00"),
        average_cost=Decimal("2000.00"),
        current_price=Decimal("2040.00"),
        market_value=Decimal("204000.00"),
        total_cost=Decimal("200000.00")
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    
    # Create initial transaction
    transaction = Transaction(
        portfolio_id=portfolio.id,
        asset_id=asset.id,
        transaction_type=TransactionType.BUY,
        symbol="BTC",
        quantity=Decimal("100.00"),
        price=Decimal("2000.00"),
        fees=Decimal("0.00"),
        total_amount=Decimal("200000.00"),
        transaction_date=datetime.utcnow()
    )
    db_session.add(transaction)
    await db_session.commit()
    
    # Verify initial state
    assert asset.quantity == Decimal("100.00")
    assert asset.total_cost == Decimal("200000.00")
    assert asset.average_cost == Decimal("2000.00")
    
    # Change asset quantity (simulate user editing asset)
    portfolio_service = PortfolioService(db_session)
    update_data = {
        "quantity": Decimal("120.00")  # Increase by 20 shares
    }
    
    updated_asset = await portfolio_service.update_asset(
        portfolio_id=portfolio.id,
        asset_id=asset.id,
        user_id=test_user.id,
        asset_data=update_data
    )
    
    # Refresh asset from database
    await db_session.refresh(asset)
    await db_session.refresh(portfolio)
    
    # Verify that total_cost was recalculated correctly
    # Should be: 100 shares * $2000 + 20 shares * $2040 = $200,000 + $40,800 = $240,800
    expected_total_cost = Decimal("240800.00")
    assert asset.total_cost == expected_total_cost, f"Expected {expected_total_cost}, got {asset.total_cost}"
    
    # Verify average cost was recalculated
    expected_average_cost = expected_total_cost / Decimal("120.00")
    assert asset.average_cost == expected_average_cost, f"Expected {expected_average_cost}, got {asset.average_cost}"
    
    # Verify portfolio total_cost was updated
    assert portfolio.total_cost == expected_total_cost, f"Expected {expected_total_cost}, got {portfolio.total_cost}"
    
    # Verify that a new transaction was created
    transactions = await db_session.execute(
        "SELECT * FROM transactions WHERE asset_id = :asset_id ORDER BY transaction_date",
        {"asset_id": asset.id}
    )
    transactions = transactions.fetchall()
    assert len(transactions) == 2, f"Expected 2 transactions, got {len(transactions)}"
    
    # Verify the auto-generated transaction
    auto_transaction = transactions[1]  # Most recent
    assert auto_transaction.quantity == Decimal("20.00")
    assert auto_transaction.price == Decimal("2040.00")
    assert auto_transaction.transaction_type == TransactionType.BUY


@pytest.mark.asyncio
async def test_total_cost_recalculation_with_multiple_transactions(db_session, test_user):
    """Test total_cost recalculation with multiple buy/sell transactions"""
    
    # Create portfolio
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Portfolio",
        description="Test portfolio for multiple transactions"
    )
    db_session.add(portfolio)
    await db_session.commit()
    await db_session.refresh(portfolio)
    
    # Create asset
    asset = Asset(
        portfolio_id=portfolio.id,
        symbol="AAPL",
        name="Apple Inc.",
        asset_type=AssetType.STOCK,
        quantity=Decimal("50.00"),
        average_cost=Decimal("150.00"),
        current_price=Decimal("160.00"),
        market_value=Decimal("8000.00"),
        total_cost=Decimal("7500.00")
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    
    # Create multiple transactions
    transactions_data = [
        {"quantity": Decimal("30.00"), "price": Decimal("140.00"), "type": TransactionType.BUY},
        {"quantity": Decimal("20.00"), "price": Decimal("165.00"), "type": TransactionType.BUY},
        {"quantity": Decimal("10.00"), "price": Decimal("155.00"), "type": TransactionType.SELL},
    ]
    
    transaction_service = TransactionService(db_session)
    
    for i, tx_data in enumerate(transactions_data):
        transaction = Transaction(
            portfolio_id=portfolio.id,
            asset_id=asset.id,
            transaction_type=tx_data["type"],
            symbol="AAPL",
            quantity=tx_data["quantity"],
            price=tx_data["price"],
            fees=Decimal("0.00"),
            total_amount=tx_data["quantity"] * tx_data["price"],
            transaction_date=datetime.utcnow()
        )
        db_session.add(transaction)
        await db_session.commit()
        
        # Update asset after each transaction
        await transaction_service._update_asset_from_transaction(asset, transaction)
        await db_session.refresh(asset)
    
    # Verify final state
    # Expected: 30 * 140 + 20 * 165 - 10 * 150 = 4200 + 3300 - 1500 = 6000
    expected_total_cost = Decimal("6000.00")
    expected_quantity = Decimal("40.00")  # 30 + 20 - 10
    expected_average_cost = expected_total_cost / expected_quantity
    
    assert asset.quantity == expected_quantity
    assert asset.total_cost == expected_total_cost
    assert asset.average_cost == expected_average_cost
    
    # Now change quantity and verify recalculation
    portfolio_service = PortfolioService(db_session)
    update_data = {"quantity": Decimal("60.00")}  # Add 20 more shares
    
    await portfolio_service.update_asset(
        portfolio_id=portfolio.id,
        asset_id=asset.id,
        user_id=test_user.id,
        asset_data=update_data
    )
    
    await db_session.refresh(asset)
    await db_session.refresh(portfolio)
    
    # Verify new total_cost includes the additional shares at current price
    additional_cost = Decimal("20.00") * asset.current_price  # 20 * 160 = 3200
    new_expected_total_cost = expected_total_cost + additional_cost
    new_expected_quantity = expected_quantity + Decimal("20.00")
    new_expected_average_cost = new_expected_total_cost / new_expected_quantity
    
    assert asset.quantity == new_expected_quantity
    assert asset.total_cost == new_expected_total_cost
    assert asset.average_cost == new_expected_average_cost
    assert portfolio.total_cost == new_expected_total_cost


@pytest.mark.asyncio
async def test_manual_recalculation_endpoint(db_session, test_user, client):
    """Test the manual recalculation endpoint"""
    
    # Create portfolio and asset
    portfolio = Portfolio(
        user_id=test_user.id,
        name="Test Portfolio",
        description="Test portfolio for manual recalculation"
    )
    db_session.add(portfolio)
    await db_session.commit()
    await db_session.refresh(portfolio)
    
    asset = Asset(
        portfolio_id=portfolio.id,
        symbol="TSLA",
        name="Tesla Inc.",
        asset_type=AssetType.STOCK,
        quantity=Decimal("10.00"),
        average_cost=Decimal("200.00"),
        current_price=Decimal("250.00"),
        market_value=Decimal("2500.00"),
        total_cost=Decimal("2000.00")
    )
    db_session.add(asset)
    await db_session.commit()
    await db_session.refresh(asset)
    
    # Create transaction
    transaction = Transaction(
        portfolio_id=portfolio.id,
        asset_id=asset.id,
        transaction_type=TransactionType.BUY,
        symbol="TSLA",
        quantity=Decimal("10.00"),
        price=Decimal("200.00"),
        fees=Decimal("0.00"),
        total_amount=Decimal("2000.00"),
        transaction_date=datetime.utcnow()
    )
    db_session.add(transaction)
    await db_session.commit()
    
    # Manually corrupt the total_cost to simulate inconsistency
    asset.total_cost = Decimal("9999.99")  # Wrong value
    await db_session.commit()
    await db_session.refresh(asset)
    
    # Call the recalculation endpoint
    response = await client.post(
        f"/api/v1/portfolios/{portfolio.id}/assets/{asset.id}/recalculate",
        headers={"Authorization": f"Bearer {test_user.id}"}  # Simplified auth for test
    )
    
    assert response.status_code == 200
    
    # Verify asset was recalculated correctly
    await db_session.refresh(asset)
    assert asset.total_cost == Decimal("2000.00")  # Should be back to correct value 