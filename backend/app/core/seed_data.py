"""
Database seed data initialization
Creates demo users and sample data for development
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db, init_db
from app.services.auth_service import AuthService
from app.schemas.user import UserCreate


async def create_demo_users():
    """Create demo users for development and testing"""
    
    demo_users = [
        {
            "email": "demo@financeflow.com",
            "password": "demo12345",
            "first_name": "Demo",
            "last_name": "User",
            "accept_terms": True
        },
        {
            "email": "admin@financeflow.com",
            "password": "admin12345",
            "first_name": "Admin",
            "last_name": "User",
            "accept_terms": True
        }
    ]
    
    await init_db()
    
    async for db in get_db():
        auth_service = AuthService(db)
        
        for user_data in demo_users:
            try:
                # Check if user already exists
                existing_user = await auth_service.get_user_by_email(user_data["email"])
                if existing_user:
                    print(f"User {user_data['email']} already exists")
                    continue
                
                # Create user
                user_create = UserCreate(
                    email=user_data["email"],
                    password=user_data["password"],
                    password_confirm=user_data["password"],
                    first_name=user_data["first_name"],
                    last_name=user_data["last_name"],
                    accept_terms=user_data["accept_terms"]
                )
                
                user = await auth_service.create_user(user_create)
                await db.commit()
                print(f"Created demo user: {user.email}")
                
            except Exception as e:
                print(f"Error creating user {user_data['email']}: {e}")
                await db.rollback()
        
        break


async def seed_database():
    """Main function to seed the database with initial data"""
    print("Starting database seeding...")
    
    # Create demo users
    await create_demo_users()
    
    # Add more seed data functions here as needed
    # await create_sample_portfolios()
    # await create_sample_transactions()
    
    print("Database seeding completed!")


if __name__ == "__main__":
    asyncio.run(seed_database())
