#!/bin/bash

echo "🚀 Starting FinanceFlow Development Environment"

# Stop any existing containers
echo "Stopping existing containers..."
docker compose -f docker-compose.dev.yml down

# Build and start services
echo "Building and starting services..."
docker compose -f docker-compose.dev.yml up --build -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Check service status
echo "Checking service status..."
echo "Frontend: http://localhost:3000"
echo "Backend API: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo "Database: localhost:5433"
echo "Redis: localhost:6380"

# Show logs
echo "Showing service logs (Ctrl+C to exit)..."
docker compose -f docker-compose.dev.yml logs -f