-- Database initialization script
-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create database user if not exists (handled by environment variables)
-- This file is for additional initialization if needed

-- Set timezone
SET timezone = 'UTC';

-- Create initial schema (will be handled by Alembic migrations in production)
-- This is just for development setup

-- The database tables will be created by SQLAlchemy automatically
-- But we can add initial data here after the application starts