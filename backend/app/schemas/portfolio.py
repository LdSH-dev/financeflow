"""
Portfolio Pydantic Schemas
"""

from datetime import datetime, date
from decimal import Decimal
from typing import List, Optional, Union
from pydantic import BaseModel, Field, ConfigDict

from app.db.models import Currency, AssetType, TransactionType


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase"""
    components = string.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])


class PortfolioBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    currency: Currency = Currency.USD


class PortfolioCreate(PortfolioBase):
    pass


class PortfolioUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    currency: Optional[Currency] = None


class AssetBase(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    name: str = Field(..., min_length=1, max_length=200)
    asset_type: AssetType
    sector: Optional[str] = Field(None, max_length=100)
    industry: Optional[str] = Field(None, max_length=100)


class AssetCreate(BaseModel):
    symbol: str = Field(..., min_length=1, max_length=20)
    quantity: Decimal = Field(..., gt=0)
    price: Decimal = Field(..., ge=0)
    transaction_date: Optional[Union[datetime, date, str]] = None
    notes: Optional[str] = Field(None, max_length=500)


class AssetUpdate(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)
    
    quantity: Optional[Decimal] = Field(None, gt=0)
    current_price: Optional[Decimal] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=500)


class AssetResponse(AssetBase):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
    
    id: str
    portfolio_id: str
    quantity: Decimal
    average_cost: Decimal
    current_price: Decimal
    market_value: Decimal
    total_cost: Decimal
    unrealized_gain_loss: Decimal
    day_change: Decimal
    day_change_percent: Decimal
    weight: Decimal
    dividend_yield: Optional[Decimal] = None
    pe_ratio: Optional[Decimal] = None
    market_cap: Optional[Decimal] = None
    created_at: datetime
    updated_at: datetime
    last_price_update: Optional[datetime] = None


class TransactionBase(BaseModel):
    transaction_type: TransactionType
    symbol: str = Field(..., min_length=1, max_length=20)
    quantity: Decimal = Field(..., gt=0)
    price: Decimal = Field(..., ge=0)
    fees: Decimal = Field(default=Decimal("0.00"), ge=0)
    transaction_date: datetime
    notes: Optional[str] = Field(None, max_length=1000)


class TransactionCreate(TransactionBase):
    asset_id: str


class TransactionResponse(TransactionBase):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
    
    id: str
    portfolio_id: str
    asset_id: str
    total_amount: Decimal
    created_at: datetime


class AssetAllocation(BaseModel):
    asset_type: AssetType
    value: Decimal
    percentage: Decimal
    target: Optional[Decimal] = None


class PerformancePeriod(BaseModel):
    return_value: Decimal = Field(alias="return")
    return_percent: Decimal
    start_value: Decimal
    end_value: Decimal
    start_date: datetime
    end_date: datetime

    model_config = ConfigDict(populate_by_name=True)


class PerformanceData(BaseModel):
    total_return: Decimal
    total_return_percent: Decimal
    annualized_return: Decimal
    volatility: Decimal
    sharpe_ratio: Decimal
    max_drawdown: Decimal
    one_day: Optional[PerformancePeriod] = None
    one_week: Optional[PerformancePeriod] = None
    one_month: Optional[PerformancePeriod] = None
    three_months: Optional[PerformancePeriod] = None
    six_months: Optional[PerformancePeriod] = None
    one_year: Optional[PerformancePeriod] = None
    three_years: Optional[PerformancePeriod] = None
    five_years: Optional[PerformancePeriod] = None
    inception: Optional[PerformancePeriod] = None


class PortfolioResponse(PortfolioBase):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
    
    id: str
    user_id: str
    total_value: Decimal
    total_cost: Decimal
    day_change: Decimal
    day_change_percent: Decimal
    assets: List[AssetResponse] = []
    allocation: List[AssetAllocation] = []
    performance: Optional[PerformanceData] = None
    created_at: datetime
    updated_at: datetime


class PortfolioSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
    
    id: str
    name: str
    total_value: Decimal
    day_change: Decimal
    day_change_percent: Decimal
    updated_at: datetime