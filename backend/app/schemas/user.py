"""
User Pydantic Schemas
"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict

from app.db.models import Currency, RiskTolerance


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase"""
    components = string.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])


class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str = Field(..., min_length=8, max_length=128)
    accept_terms: bool = Field(..., description="Must accept terms and conditions")

    def validate_passwords_match(self) -> 'UserCreate':
        if self.password != self.password_confirm:
            raise ValueError('Passwords do not match')
        return self


class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    avatar_url: Optional[str] = Field(None, max_length=500)
    preferred_currency: Optional[Currency] = None
    timezone: Optional[str] = Field(None, max_length=50)
    theme: Optional[str] = Field(None, pattern="^(light|dark|system)$")
    risk_tolerance: Optional[RiskTolerance] = None
    email_notifications: Optional[bool] = None
    push_notifications: Optional[bool] = None
    portfolio_alerts: Optional[bool] = None
    market_news: Optional[bool] = None


class UserPreferences(BaseModel):
    preferred_currency: Currency
    timezone: str
    theme: str
    risk_tolerance: RiskTolerance
    email_notifications: bool
    push_notifications: bool
    portfolio_alerts: bool
    market_news: bool


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True, alias_generator=to_camel, populate_by_name=True)
    
    id: str
    is_active: bool
    is_verified: bool
    preferences: UserPreferences
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    @classmethod
    def from_orm_with_preferences(cls, user_obj):
        """Create UserResponse with embedded preferences"""
        preferences = UserPreferences(
            preferred_currency=user_obj.preferred_currency,
            timezone=user_obj.timezone,
            theme=user_obj.theme,
            risk_tolerance=user_obj.risk_tolerance,
            email_notifications=user_obj.email_notifications,
            push_notifications=user_obj.push_notifications,
            portfolio_alerts=user_obj.portfolio_alerts,
            market_news=user_obj.market_news,
        )
        
        return cls(
            id=user_obj.id,
            email=user_obj.email,
            first_name=user_obj.first_name,
            last_name=user_obj.last_name,
            avatar_url=user_obj.avatar_url,
            is_active=user_obj.is_active,
            is_verified=user_obj.is_verified,
            preferences=preferences,
            created_at=user_obj.created_at,
            updated_at=user_obj.updated_at,
            last_login_at=user_obj.last_login_at,
        )


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)
    confirm_password: str = Field(..., min_length=8, max_length=128)

    def validate_passwords_match(self) -> 'ChangePasswordRequest':
        if self.new_password != self.confirm_password:
            raise ValueError('New passwords do not match')
        return self