# FinTrackr - Personal Finance Management System

A comprehensive personal finance management application built with React, Node.js, TypeScript, and PostgreSQL. Features enterprise-grade testing with 90%+ backend coverage, WCAG-compliant accessibility, and automated Azure deployment via GitHub Actions.

## Features

- 📊 **Dashboard Overview** - Get a complete view of your financial health
- 💳 **Transaction Management** - Track income and expenses with categories
- 🏦 **Account Management** - Manage multiple bank accounts and credit cards
- 📈 **Budget Tracking** - Set and monitor budgets with progress indicators
- 📋 **Reports & Analytics** - Detailed financial reports and spending trends
- 🔐 **Secure Authentication** - JWT-based authentication system with rate limiting
- 📱 **Responsive Design** - Mobile-first design that works seamlessly across all devices
- ♿ **Accessibility-First** - WCAG 2.1 AA compliant with semantic HTML and ARIA labels
- 🧪 **90%+ Test Coverage** - Comprehensive unit and integration tests for reliability

## Tech Stack

### Frontend

- React 18 with TypeScript
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Recharts for data visualization
- Lucide React for icons

### Backend

- Node.js with Express
- TypeScript
- PostgreSQL with TypeORM
- JWT authentication
- Express validation & sanitization
- Helmet security headers
- Rate limiting and CORS middleware
- 90%+ test coverage with Jest and Supertest
- Normalized database schema

### DevOps & Testing

- Docker & Docker Compose for containerization
- GitHub Actions CI/CD pipeline
- Automated deployment to Azure App Services (70% faster deployment)
- Jest for backend testing (90%+ coverage)
- React Testing Library for frontend testing
- Lighthouse CI for performance monitoring
- Automated security scanning with Snyk
- PostgreSQL 15 database

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Docker (optional)

### Option 1: Using Docker (Recommended)

1. Clone the repository:

```bash
git clone <repository-url>
cd FinTrackr
```

2. Start all services with Docker Compose:

```bash
docker-compose up -d
```

This will start:

- PostgreSQL database on port 5432
- Backend API on port 3001
- Frontend React app on port 3000

### Option 2: Manual Setup

1. **Setup Database**

```bash
# Install PostgreSQL and create database
createdb fintrackr_db
```

2. **Setup Backend**

```bash
cd backend
npm install
cp env.example .env
# Edit .env with your database credentials
npm run dev
```

3. **Setup Frontend**

```bash
cd frontend
npm install
npm start
```

## Environment Variables

### Backend (.env)

```env
PORT=3001
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=fintrackr_db
DB_USER=fintrackr_user
DB_PASSWORD=fintrackr_password
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Dashboard

- `GET /api/dashboard/overview` - Get dashboard overview
- `GET /api/dashboard/trends` - Get spending trends

### Transactions

- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Accounts

- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/:id` - Update account
- `DELETE /api/accounts/:id` - Delete account

### Budgets

- `GET /api/budgets` - Get all budgets
- `POST /api/budgets` - Create new budget
- `PUT /api/budgets/:id` - Update budget
- `DELETE /api/budgets/:id` - Delete budget

## Development

### Backend Development

```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm test            # Run test suite
npm run test:coverage # Run tests with coverage report (target: 90%+)
npm run test:watch   # Run tests in watch mode
```

### Frontend Development

```bash
cd frontend
npm start           # Start development server (localhost:3000)
npm run build       # Build optimized production bundle
npm test           # Run React tests with Jest
npm test -- --coverage # Run tests with coverage report
```

## Testing

### Backend Testing

The backend has comprehensive test coverage (90%+) including:

- **Unit Tests**: Individual function and class testing
- **Integration Tests**: API endpoint testing with Supertest
- **Database Tests**: TypeORM model and relationship testing
- **Middleware Tests**: Authentication and error handling tests

```bash
cd backend
npm test                  # Run all tests
npm run test:coverage     # Generate coverage report
npm run test:watch        # Watch mode for development
```

Coverage thresholds enforced:
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

### Frontend Testing

Frontend tests use React Testing Library and Jest:

- **Component Tests**: UI component rendering and behavior
- **Accessibility Tests**: ARIA labels and semantic HTML validation
- **Integration Tests**: User interaction flows

```bash
cd frontend
npm test                          # Run all tests
npm test -- --coverage            # Generate coverage report
npm test -- --coverage --watchAll=false  # CI mode
```

## Database Schema

The application uses a normalized PostgreSQL schema with the following entities:

- **Users** - User accounts and profiles (bcrypt hashed passwords)
- **Accounts** - Bank accounts, credit cards, savings (one-to-many with Users)
- **Transactions** - Income and expense transactions (linked to Accounts and Categories)
- **Categories** - Transaction categories (customizable per user)
- **Budgets** - Budget tracking with period-based limits (weekly, monthly, yearly)

All tables include:
- Primary keys with auto-increment
- Foreign key constraints for referential integrity
- Timestamps (createdAt, updatedAt)
- Proper indexes for performance

## Deployment

### Azure App Services (Production)

The application is configured for automated deployment to Azure App Services via GitHub Actions.

#### Prerequisites
1. Azure account with active subscription
2. Two App Services created (backend + frontend)
3. Azure PostgreSQL Flexible Server
4. GitHub repository secrets configured

#### Deployment Process

**Automatic Deployment:**
- Push to `main` branch triggers GitHub Actions workflow
- Runs tests, builds, and deploys to Azure
- Backend deployed to `https://<app-name>.azurewebsites.net`
- Frontend deployed to `https://<app-name>.azurewebsites.net`
- Lighthouse performance audit runs post-deployment

**Manual Deployment:**
```bash
# See .azure/deploy-instructions.md for detailed steps
az webapp up --name fintrackr-backend --resource-group fintrackr-rg
az webapp up --name fintrackr-frontend --resource-group fintrackr-rg
```

#### GitHub Secrets Required

Add these secrets in your GitHub repository (Settings → Secrets):

- `AZURE_BACKEND_APP_NAME` - Backend app service name
- `AZURE_FRONTEND_APP_NAME` - Frontend app service name
- `AZURE_BACKEND_PUBLISH_PROFILE` - Backend publish profile (XML)
- `AZURE_FRONTEND_PUBLISH_PROFILE` - Frontend publish profile (XML)
- `AZURE_BACKEND_URL` - Backend URL for frontend API calls
- `SNYK_TOKEN` - Snyk security scanning token (optional)

#### Deployment Time Improvement

Optimizations that reduce deployment time by ~70%:
- Cached npm dependencies in GitHub Actions
- Parallel build processes
- Multi-stage Docker builds with layer caching
- Optimized production builds
- Azure CDN for static assets

### Local Deployment with Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## CI/CD Pipeline

The GitHub Actions workflow includes:

1. **Testing** - Backend and frontend unit/integration tests
2. **Type Checking** - TypeScript compilation validation
3. **Security Scanning** - Snyk vulnerability detection
4. **Docker Build** - Container image building and testing
5. **Azure Deployment** - Automated deployment to production
6. **Lighthouse Audit** - Performance and accessibility scoring
7. **Notifications** - Automated PR comments with results

## Accessibility

FinTrackr follows WCAG 2.1 Level AA guidelines:

- ✅ Semantic HTML5 elements (`header`, `nav`, `main`, `section`, `aside`)
- ✅ ARIA labels and roles for all interactive elements
- ✅ Keyboard navigation support (focus indicators)
- ✅ Screen reader compatibility
- ✅ Color contrast ratios meet AA standards
- ✅ Responsive text sizing
- ✅ Alt text for images
- ✅ Form labels and error messages
- ✅ Skip to main content link
- ✅ Progress indicators with ARIA attributes

## Performance

- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices)
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.5s
- Optimized bundle sizes with code splitting
- Lazy loading for routes and components

## Security

- JWT-based authentication with secure httpOnly cookies
- Bcrypt password hashing (10 rounds)
- Helmet.js security headers
- Rate limiting on API endpoints
- CORS configuration
- SQL injection prevention via TypeORM parameterized queries
- XSS protection
- Input validation and sanitization
- Environment variable management
- Regular dependency updates via Dependabot

## Project Structure

```
FinTrackr/
├── backend/
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth, error handling
│   │   ├── models/        # TypeORM entities
│   │   ├── routes/        # API routes
│   │   └── index.ts       # Entry point
│   ├── __tests__/         # Test files (90%+ coverage)
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── .github/
│   └── workflows/
│       └── ci.yml         # CI/CD pipeline
├── .azure/                # Azure deployment configs
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests (maintain 90%+ coverage)
5. Ensure all tests pass (`npm test`)
6. Commit with conventional commits (`git commit -m 'feat: add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines

- Write tests for all new features
- Follow TypeScript best practices
- Maintain accessibility standards (WCAG 2.1 AA)
- Use semantic HTML
- Add proper error handling
- Document complex functions
- Keep components small and focused

## License

MIT License - see LICENSE file for details

## Author

**Rohan Shinde**

## Support

For support and questions:
- Open an issue on GitHub
- Check existing documentation in `.azure/deploy-instructions.md`
- Review API documentation in README

## Acknowledgments

- Built with TypeScript, React, Node.js, and PostgreSQL
- Deployed on Azure App Services
- CI/CD with GitHub Actions
- Testing with Jest and React Testing Library
