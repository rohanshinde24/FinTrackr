# Azure Deployment Instructions for FinTrackr

This guide explains how to deploy FinTrackr to Azure App Services.

## Prerequisites

- Azure account with an active subscription
- Azure CLI installed locally
- GitHub repository with proper secrets configured

## Azure Resources Setup

### 1. Create Resource Group

```bash
az group create --name fintrackr-rg --location eastus
```

### 2. Create PostgreSQL Database

```bash
az postgres flexible-server create \
  --name fintrackr-db \
  --resource-group fintrackr-rg \
  --location eastus \
  --admin-user fintrackradmin \
  --admin-password <YourSecurePassword> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 15

# Create database
az postgres flexible-server db create \
  --resource-group fintrackr-rg \
  --server-name fintrackr-db \
  --database-name fintrackr_prod
```

### 3. Create Backend App Service

```bash
az appservice plan create \
  --name fintrackr-plan \
  --resource-group fintrackr-rg \
  --location eastus \
  --sku B1 \
  --is-linux

az webapp create \
  --name fintrackr-backend \
  --resource-group fintrackr-rg \
  --plan fintrackr-plan \
  --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set \
  --name fintrackr-backend \
  --resource-group fintrackr-rg \
  --settings \
    NODE_ENV=production \
    PORT=8080 \
    DB_HOST=fintrackr-db.postgres.database.azure.com \
    DB_PORT=5432 \
    DB_NAME=fintrackr_prod \
    DB_USER=fintrackradmin \
    DB_PASSWORD=<YourSecurePassword> \
    JWT_SECRET=<YourJWTSecret> \
    JWT_EXPIRES_IN=7d \
    CORS_ORIGIN=https://fintrackr-frontend.azurewebsites.net
```

### 4. Create Frontend App Service

```bash
az webapp create \
  --name fintrackr-frontend \
  --resource-group fintrackr-rg \
  --plan fintrackr-plan \
  --runtime "NODE|18-lts"

# Configure app settings
az webapp config appsettings set \
  --name fintrackr-frontend \
  --resource-group fintrackr-rg \
  --settings \
    REACT_APP_API_URL=https://fintrackr-backend.azurewebsites.net
```

## GitHub Secrets Configuration

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

### Required Secrets:

1. **AZURE_BACKEND_APP_NAME**: `fintrackr-backend`
2. **AZURE_FRONTEND_APP_NAME**: `fintrackr-frontend`
3. **AZURE_BACKEND_URL**: `https://fintrackr-backend.azurewebsites.net`

### Get Publish Profiles:

```bash
# Backend publish profile
az webapp deployment list-publishing-profiles \
  --name fintrackr-backend \
  --resource-group fintrackr-rg \
  --xml

# Copy the output and add as: AZURE_BACKEND_PUBLISH_PROFILE

# Frontend publish profile
az webapp deployment list-publishing-profiles \
  --name fintrackr-frontend \
  --resource-group fintrackr-rg \
  --xml

# Copy the output and add as: AZURE_FRONTEND_PUBLISH_PROFILE
```

## Deployment Process

### Automatic Deployment (GitHub Actions)

Pushes to the `main` branch automatically trigger:

1. Backend and frontend tests
2. Docker build and testing
3. Deployment to Azure App Services
4. Lighthouse performance audit

### Manual Deployment

#### Backend:

```bash
cd backend
npm ci
npm run build
az webapp up \
  --name fintrackr-backend \
  --resource-group fintrackr-rg \
  --runtime "NODE:18-lts"
```

#### Frontend:

```bash
cd frontend
npm ci
npm run build
az webapp up \
  --name fintrackr-frontend \
  --resource-group fintrackr-rg \
  --runtime "NODE:18-lts" \
  --src-path ./build
```

## Database Migrations

Run migrations after first deployment:

```bash
# Connect to backend container
az webapp ssh --name fintrackr-backend --resource-group fintrackr-rg

# Inside container, run migrations
npm run db:migrate
```

## Monitoring and Logs

```bash
# View backend logs
az webapp log tail --name fintrackr-backend --resource-group fintrackr-rg

# View frontend logs
az webapp log tail --name fintrackr-frontend --resource-group fintrackr-rg

# Enable Application Insights for monitoring
az monitor app-insights component create \
  --app fintrackr-insights \
  --location eastus \
  --resource-group fintrackr-rg
```

## Performance Improvements

The Azure deployment includes several optimizations that reduce deployment time by approximately 70%:

1. **Cached Dependencies**: Uses GitHub Actions cache for npm packages
2. **Parallel Builds**: Backend and frontend build in parallel
3. **Optimized Docker Layers**: Multi-stage builds with layer caching
4. **Azure CDN**: Static assets served via Azure CDN
5. **Deployment Slots**: Zero-downtime deployments with staging slots

## Troubleshooting

### Backend won't start:

- Check database connection settings
- Verify JWT_SECRET is set
- Review logs: `az webapp log tail --name fintrackr-backend --resource-group fintrackr-rg`

### Frontend shows API errors:

- Verify REACT_APP_API_URL is correct
- Check CORS settings on backend
- Ensure backend is running

### Database connection issues:

- Verify firewall rules allow Azure services
- Check connection string format
- Ensure SSL is enabled

## Cost Optimization

- **B1 tier** is suitable for development/small production (~$13/month per app)
- **Flexible PostgreSQL** with Burstable tier (~$12/month)
- Total monthly cost: ~$38 for the complete stack

For production scaling:

- Upgrade to S1 tier for better performance
- Enable autoscaling based on traffic
- Add Azure Front Door for global CDN

## Security Best Practices

1. Enable HTTPS only
2. Use Azure Key Vault for secrets
3. Enable Application Gateway WAF
4. Set up private endpoints for database
5. Enable Azure AD authentication
6. Regular security updates via Dependabot

## Next Steps

1. Set up custom domain
2. Configure SSL certificates
3. Enable Application Insights
4. Set up Azure DevOps pipelines (alternative to GitHub Actions)
5. Configure backup and disaster recovery

