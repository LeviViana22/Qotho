# Database Authentication Setup

This guide will help you set up NextAuth with PostgreSQL database authentication for your Qotho application.

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running (Docker or local installation)
- Docker (optional, for running PostgreSQL in a container)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

#### Option A: Using Docker (Recommended)

1. Create a `docker-compose.yml` file in your project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: qotho-postgres
    environment:
      POSTGRES_DB: qotho_db
      POSTGRES_USER: qotho_user
      POSTGRES_PASSWORD: qotho_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

2. Start the database:
```bash
docker-compose up -d
```

#### Option B: Local PostgreSQL Installation

1. Install PostgreSQL locally
2. Create a database named `qotho_db`
3. Create a user with appropriate permissions

### 3. Environment Configuration

1. Copy the environment file:
```bash
cp env.example .env.local
```

2. Update the `.env.local` file with your database credentials:

```env
# Database Configuration
DATABASE_URL="postgresql://qotho_user:qotho_password@localhost:5432/qotho_db?schema=public"

# NextAuth Configuration
AUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (Optional)
GOOGLE_AUTH_CLIENT_ID=your-google-client-id
GOOGLE_AUTH_CLIENT_SECRET=your-google-client-secret
GITHUB_AUTH_CLIENT_ID=your-github-client-id
GITHUB_AUTH_CLIENT_SECRET=your-github-client-secret
```

### 4. Database Migration

1. Generate Prisma client:
```bash
npm run db:generate
```

2. Push the schema to your database:
```bash
npm run db:push
```

3. Seed the database with an admin user:
```bash
npm run db:seed
```

### 5. Start the Application

```bash
npm run dev
```

## Default Admin User

After running the seed script, you can log in with:

- **Email**: admin@example.com
- **Password**: admin123
- **Role**: admin

## Features

### Authentication
- Email/password authentication
- OAuth providers (Google, GitHub)
- Session management with JWT
- Password hashing with bcrypt

### Authorization
- Role-based access control
- Admin-only pages (roles & permissions)
- User profile management (accessible to all users)

### User Management
- Create, read, update, delete users
- Role assignment (admin, user, supervisor, support, auditor, guest)
- Status management (active, blocked)
- Personal information management

## Database Schema

The application uses the following main models:

- **User**: Core user information
- **Account**: OAuth account linking
- **Session**: User sessions
- **VerificationToken**: Email verification tokens

## API Endpoints

- `/api/auth/[...nextauth]` - NextAuth API routes
- All other API routes are protected and require authentication

## Security Features

- Password hashing with bcrypt
- JWT-based sessions
- CSRF protection
- Secure cookie handling
- Role-based route protection

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your DATABASE_URL format
- Verify database credentials

### Authentication Issues
- Check AUTH_SECRET is set
- Verify NEXTAUTH_URL matches your domain
- Ensure OAuth provider credentials are correct

### Permission Issues
- Verify user roles in the database
- Check middleware configuration
- Ensure proper route protection

## Development

### Adding New Roles
1. Update the role options in the constants
2. Add role validation in the auth configuration
3. Update the UI components to handle new roles

### Customizing User Fields
1. Update the Prisma schema
2. Run `npm run db:push` to update the database
3. Update the user management functions
4. Update the UI components

## Production Deployment

1. Set up a production PostgreSQL database
2. Update environment variables for production
3. Run database migrations
4. Seed the database with initial admin user
5. Deploy the application

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.


