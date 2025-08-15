"""
Application Configuration
"""

from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Basic settings
    PROJECT_NAME: str = "FinanceFlow API"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    
    # Database
    DATABASE_URL: str = "postgresql://financeflow:password123@localhost:5432/financeflow"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8080,http://localhost,http://127.0.0.1"
    
    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    # Allowed hosts
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # External APIs
    MARKET_DATA_API_KEY: str = ""
    MARKET_DATA_BASE_URL: str = ""
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()