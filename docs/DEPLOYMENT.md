# Deployment Guide

## 🚀 Deployment Overview

This guide covers multiple deployment strategies for the Portfolio Management System, from local development to production environments. The system is designed with Docker-first architecture for consistent deployments across all environments.

## 🏗️ System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps

### Recommended Production Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: 1 Gbps
- **Load Balancer**: Nginx or cloud provider LB

### Software Dependencies
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **SSL Certificates**: For HTTPS in production

## 🐳 Docker Deployment (Recommended)

### Quick Start - Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd highspring_example

# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Verify deployment
curl http://localhost:3000  # Frontend
curl http://localhost:8000/docs  # Backend API docs
```

### Production Deployment

```bash
# Clone and configure
git clone <repository-url>
cd highspring_example

# Set production environment variables
cp .env.example .env.production
# Edit .env.production with your production values

# Deploy with production configuration
docker-compose -f docker-compose.yml up -d

# Verify deployment
curl https://yourdomain.com/health
```

## ⚙️ Environment Configuration

### Environment Variables

Create environment-specific files:

#### `.env.development`
```bash
# Database
DATABASE_URL=postgresql://financeflow:password123@db:5432/financeflow
REDIS_URL=redis://redis:6379/0

# Security
SECRET_KEY=development-secret-key-change-in-production
JWT_SECRET_KEY=jwt-development-secret-key
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_V1_STR=/api/v1
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Application
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=DEBUG

# Frontend
VITE_API_URL=http://localhost:8000/api/v1
VITE_WS_URL=ws://localhost:8000/ws
```

#### `.env.production`
```bash
# Database (Use managed database service in production)
DATABASE_URL=postgresql://user:password@prod-db-host:5432/financeflow
REDIS_URL=redis://prod-redis-host:6379/0

# Security (Generate strong secrets)
SECRET_KEY=your-super-secure-secret-key-min-32-chars
JWT_SECRET_KEY=your-jwt-secret-key-min-32-chars
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# API Configuration
API_V1_STR=/api/v1
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Application
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO

# Frontend
VITE_API_URL=https://yourdomain.com/api/v1
VITE_WS_URL=wss://yourdomain.com/ws

# SSL/TLS
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### Database Configuration

#### PostgreSQL Setup
```sql
-- Create database and user
CREATE DATABASE financeflow;
CREATE USER financeflow WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE financeflow TO financeflow;

-- Create extensions
\c financeflow
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
```

#### Redis Configuration
```bash
# redis.conf for production
bind 127.0.0.1
port 6379
requirepass your-redis-password
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

## 🌐 Production Deployment Strategies

### 1. Single Server Deployment

#### Docker Compose Production Setup
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      target: production
    restart: unless-stopped
    environment:
      - VITE_API_URL=https://yourdomain.com/api/v1

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped
    depends_on:
      - frontend
      - backend
```

#### Nginx Production Configuration
```nginx
# nginx.prod.conf
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:3000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS Configuration
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        # SSL Security Headers
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # Security Headers
        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # API Routes
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket Support
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
        }

        # Frontend Routes
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 2. Cloud Provider Deployment

#### AWS ECS Deployment
```json
{
  "family": "portfolio-management",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/portfolio-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "DATABASE_URL",
          "value": "postgresql://user:pass@rds-endpoint:5432/db"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/portfolio-management",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### Google Cloud Run Deployment
```yaml
# cloudbuild.yaml
steps:
  # Build backend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/portfolio-backend', './backend']
  
  # Build frontend
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/portfolio-frontend', '.']
  
  # Push images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/portfolio-backend']
  
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/portfolio-frontend']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args: ['run', 'deploy', 'portfolio-backend', 
           '--image', 'gcr.io/$PROJECT_ID/portfolio-backend',
           '--platform', 'managed',
           '--region', 'us-central1',
           '--allow-unauthenticated']
```

### 3. Kubernetes Deployment

#### Kubernetes Manifests
```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: portfolio-management

---
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: portfolio-management
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: portfolio-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/v1/health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/v1/health
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/backend-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: portfolio-management
spec:
  selector:
    app: backend
  ports:
  - port: 8000
    targetPort: 8000
  type: ClusterIP
```

## 🔧 Database Migration and Setup

### Initial Database Setup
```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create initial admin user (optional)
docker-compose exec backend python -c "
from app.core.database import get_db
from app.services.auth_service import AuthService
import asyncio

async def create_admin():
    async for db in get_db():
        service = AuthService(db)
        await service.create_user(
            email='admin@example.com',
            password='admin123',
            first_name='Admin',
            last_name='User'
        )
        break

asyncio.run(create_admin())
"
```

### Database Backup Strategy
```bash
# Automated backup script
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="financeflow"

# Create backup
docker-compose exec -T db pg_dump -U financeflow $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Upload to cloud storage (optional)
# aws s3 cp $BACKUP_DIR/backup_$DATE.sql.gz s3://your-backup-bucket/
```

## 📊 Monitoring and Logging

### Health Checks
```bash
# Application health check
curl -f http://localhost:8000/api/v1/health || exit 1

# Database connectivity check
docker-compose exec backend python -c "
import asyncio
from app.core.database import engine
async def check_db():
    async with engine.begin() as conn:
        result = await conn.execute('SELECT 1')
        print('Database OK')
asyncio.run(check_db())
"

# Redis connectivity check
docker-compose exec redis redis-cli ping
```

### Logging Configuration
```python
# backend/app/core/logging.py
import logging
import sys
from typing import Any, Dict

def setup_logging(log_level: str = "INFO") -> None:
    """Configure application logging"""
    
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler("/var/log/app.log")
        ]
    )
    
    # Suppress noisy loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
```

### Monitoring with Prometheus (Optional)
```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources

volumes:
  grafana-storage:
```

## 🔒 Security Checklist

### Pre-Production Security
- [ ] Change all default passwords and secrets
- [ ] Configure SSL/TLS certificates
- [ ] Set up firewall rules (ports 80, 443 only)
- [ ] Enable rate limiting
- [ ] Configure CORS properly
- [ ] Set up monitoring and alerting
- [ ] Implement backup strategy
- [ ] Review and update dependencies
- [ ] Configure log rotation
- [ ] Set up intrusion detection

### SSL Certificate Setup
```bash
# Using Let's Encrypt with Certbot
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal setup
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database connectivity
docker-compose exec backend python -c "
import asyncio
from sqlalchemy import create_engine
from app.core.config import settings

async def test_connection():
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute('SELECT 1')
            print('Database connection successful')
    except Exception as e:
        print(f'Database connection failed: {e}')

asyncio.run(test_connection())
"
```

#### Frontend Build Issues
```bash
# Clear cache and rebuild
docker-compose down
docker system prune -f
docker-compose build --no-cache frontend
docker-compose up -d
```

#### Memory Issues
```bash
# Check container resource usage
docker stats

# Increase memory limits in docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G
```

### Log Analysis
```bash
# View application logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Check specific service logs
docker-compose logs --tail=100 backend

# Export logs for analysis
docker-compose logs backend > backend.log
```

## 📈 Performance Optimization

### Production Optimizations
```bash
# Enable production optimizations
export NODE_ENV=production
export ENVIRONMENT=production

# Build optimized images
docker-compose -f docker-compose.yml build --no-cache

# Use multi-stage builds for smaller images
# (Already configured in Dockerfiles)
```

### Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX CONCURRENTLY idx_assets_portfolio_id ON assets(portfolio_id);
CREATE INDEX CONCURRENTLY idx_transactions_portfolio_id ON transactions(portfolio_id);
CREATE INDEX CONCURRENTLY idx_transactions_date ON transactions(transaction_date);

-- Analyze tables for query optimization
ANALYZE portfolios;
ANALYZE assets;
ANALYZE transactions;
```

This deployment guide provides comprehensive coverage for deploying the Portfolio Management System across different environments and platforms, with emphasis on security, monitoring, and best practices.