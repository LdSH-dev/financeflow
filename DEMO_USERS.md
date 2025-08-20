# Demo Users

For development and testing purposes, the application includes demo user accounts that are automatically created when running in development mode.

## Available Demo Accounts

### Regular User
- **Email:** demo@financeflow.com
- **Password:** demo12345
- **Role:** Standard user with full portfolio management capabilities

### Admin User
- **Email:** admin@financeflow.com
- **Password:** admin12345
- **Role:** Administrator with elevated privileges

## Automatic Setup

When running the backend in development mode (`ENVIRONMENT=development`), these demo accounts are automatically created during application startup.

### Manual Setup

If you need to manually create the demo users, run the following command from the backend directory:

```bash
docker exec -it space_inch-backend-1 python -m app.core.seed_data
```

Or if running locally:

```bash
cd backend
python -m app.core.seed_data
```

## Notes

- Demo users are only created in development mode
- The seed script checks for existing users to avoid duplicates
- Passwords are hashed using bcrypt before storage
- These credentials should **never** be used in production environments

## Security Warning

⚠️ **These are demo credentials for development only.** Never use these credentials or weak passwords in production environments.
