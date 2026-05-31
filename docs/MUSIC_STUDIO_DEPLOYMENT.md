# Music Studio Deployment Guide

## Pre-Deployment Checklist

- [ ] All 20+ unit tests passing (`packages/shared/src/music/__tests__/musicLogic.test.mjs`)
- [ ] Environment variables configured for all providers
- [ ] Database migrations applied (quotas, artifacts, library tables)
- [ ] Storage configured (R2, S3, or equivalent for audio files)
- [ ] API endpoints implemented for all documented routes
- [ ] Authentication layer integrated (JWT, OAuth2, or custom)
- [ ] Rate limiting configured
- [ ] Error handling tested across all endpoints
- [ ] Webhook infrastructure ready (if using event-driven flow)
- [ ] Monitoring and logging configured
- [ ] Documentation deployed and accessible

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# API Configuration
API_BASE_URL=https://api.example.com
API_PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/musicdb

# Storage
STORAGE_PROVIDER=r2  # r2, s3, or gcs
R2_BUCKET_NAME=music-storage
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key

# Music Generation Providers
ACE_STEP_API_KEY=your_ace_step_key
OPENMUSIC_API_KEY=your_openmusic_key
ELEVENLABS_API_KEY=your_elevenlabs_key

# Video Generation (optional)
RUNWAY_API_KEY=your_runway_key

# Authentication
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=24h

# Monitoring
SENTRY_DSN=your_sentry_dsn
LOG_LEVEL=info
```

## Database Schema

### Required Tables

#### quotas
```sql
CREATE TABLE quotas (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  tier VARCHAR(20) DEFAULT 'free',
  generations_used INT DEFAULT 0,
  minutes_used DECIMAL(10,2) DEFAULT 0,
  remixes_used INT DEFAULT 0,
  billing_month VARCHAR(7),
  last_generation_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, billing_month)
);
```

#### artifacts
```sql
CREATE TABLE artifacts (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  prompt TEXT,
  bpm INT,
  duration_seconds INT,
  genre VARCHAR(50),
  mood VARCHAR(50),
  mode VARCHAR(50),
  audio_url VARCHAR(2048),
  storage_key VARCHAR(2048),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(created_at)
);
```

#### artifact_library_entries
```sql
CREATE TABLE artifact_library_entries (
  id VARCHAR(36) PRIMARY KEY,
  artifact_id VARCHAR(36) NOT NULL,
  organization_id VARCHAR(36),
  workspace_id VARCHAR(36),
  owner_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  tags JSON,
  category VARCHAR(50),
  visibility VARCHAR(20) DEFAULT 'private',
  featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  remix_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(visibility),
  INDEX(featured),
  INDEX(created_at)
);
```

#### music_video_sessions
```sql
CREATE TABLE music_video_sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  music_artifact_id VARCHAR(36) NOT NULL,
  title VARCHAR(255),
  concept TEXT,
  visual_style VARCHAR(100),
  color_palette VARCHAR(100),
  camera_movement VARCHAR(100),
  beat_sync_intensity INT,
  video_prompt TEXT,
  video_url VARCHAR(2048),
  status VARCHAR(20) DEFAULT 'created',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(user_id),
  INDEX(status)
);
```

## Deployment Steps

### 1. Backend Deployment

```bash
# Build the application
npm run build

# Run database migrations
npm run migrate

# Start the server
npm run start
```

### 2. Frontend Deployment

```bash
# Build Next.js
next build

# Deploy to Vercel, Netlify, or your hosting
# Environment variables should be set in hosting platform
```

### 3. Configure Storage

For R2 (Cloudflare):
```bash
# Create a bucket
aws s3 mb s3://music-storage --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# Set CORS policy
aws s3api put-bucket-cors \
  --bucket music-storage \
  --cors-configuration file://cors.json \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

CORS configuration (`cors.json`):
```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://example.com"],
      "AllowedMethods": ["GET", "PUT"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

### 4. Configure Providers

#### Ace Step
```bash
# Register at https://ace-step.io
# Store API key in ACE_STEP_API_KEY environment variable
```

#### OpenMusic
```bash
# Register at https://openmusic.ai
# Store API key in OPENMUSIC_API_KEY environment variable
```

#### ElevenLabs Music
```bash
# Register at https://elevenlabs.io
# Store API key in ELEVENLABS_API_KEY environment variable
```

### 5. Setup Monitoring

#### Sentry
```bash
# Create project at https://sentry.io
# Initialize in application
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});
```

#### Logging
```bash
# Configure Winston or Pino for structured logging
export LOG_LEVEL=info
```

### 6. Setup Database Backups

```bash
# Schedule daily backups
0 2 * * * pg_dump $DATABASE_URL | gzip > backup-$(date +\%Y\%m\%d).sql.gz
```

### 7. Configure CI/CD

GitHub Actions workflow (`.github/workflows/deploy.yml`):

```yaml
name: Deploy Music Studio

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test
      - run: npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run build
      - uses: actions/deploy@v1
        with:
          deployment_url: ${{ secrets.DEPLOYMENT_URL }}
          api_key: ${{ secrets.DEPLOY_KEY }}
```

## Health Check Endpoints

Implement health check endpoints for monitoring:

```javascript
// GET /health
// Returns 200 if system is healthy
{
  "status": "healthy",
  "timestamp": "2026-05-31T10:00:00Z",
  "version": "1.0.0",
  "services": {
    "database": "ok",
    "storage": "ok",
    "providers": {
      "ace-step": "ok",
      "open-music": "ok",
      "elevenlabs": "ok"
    }
  }
}

// GET /health/detailed
// Returns detailed status of all subsystems
```

## Performance Optimization

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_artifacts_user_created ON artifacts(user_id, created_at DESC);
CREATE INDEX idx_library_visibility ON artifact_library_entries(visibility, created_at DESC);
CREATE INDEX idx_quotas_user_month ON quotas(user_id, billing_month);
```

### Caching Strategy
- Cache locale presets in Redis (1 hour TTL)
- Cache user quotas in Redis (5 minute TTL)
- Cache featured artifacts in Redis (1 hour TTL)
- Use CDN for audio file delivery

### Rate Limiting
```javascript
// Configure Redis-backed rate limiting
const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:',
  }),
  windowMs: 1 * 60 * 1000,
  max: tier === 'premium' ? 100 : 10,
});

app.use('/api/v1/music/', limiter);
```

## Security Checklist

- [ ] All environment variables are secrets
- [ ] HTTPS enforced on all endpoints
- [ ] CORS properly configured
- [ ] JWT validation on all protected routes
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (use prepared statements)
- [ ] XSS prevention (sanitize user inputs)
- [ ] CSRF tokens for state-changing operations
- [ ] Rate limiting implemented
- [ ] API key rotation policy
- [ ] Audit logging enabled
- [ ] PII not logged
- [ ] Encryption at rest for sensitive data

## Monitoring & Alerts

### Key Metrics
- Generation success rate
- Average generation time
- API response times
- Error rates by endpoint
- Provider availability
- Storage usage
- Database connection pool health

### Alert Thresholds
- Error rate > 5%
- Response time > 5s
- Provider unavailable > 5 minutes
- Database connection failures
- Storage quota exceeded 80%

## Rollback Procedure

```bash
# If deployment fails:
1. Identify the issue in logs
2. Revert to previous version
   git revert <commit-hash>
3. Deploy previous version
   npm run deploy
4. Verify health checks
5. Restore database from backup if needed
```

## Post-Deployment Verification

```bash
# Test all critical endpoints
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/v1/music/locales
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/v1/music/quotas/remaining
curl -H "Authorization: Bearer $TOKEN" https://api.example.com/api/v1/music/library/shared

# Verify provider connectivity
npm run verify-providers

# Run integration tests
npm run test:integration

# Check database integrity
npm run db:verify
```

## Scaling Considerations

### Horizontal Scaling
- Use load balancer (nginx, HAProxy, or cloud provider)
- Database should use connection pooling
- Redis for session storage
- Separate read replicas for analytics queries

### Vertical Scaling
- Increase server resources as needed
- Monitor CPU and memory usage
- Configure auto-scaling policies

### Rate Limiting by Tier
- Free tier: 10 req/min
- Premium tier: 100 req/min
- Enterprise: custom limits

## Disaster Recovery

### Backup Strategy
- Daily database backups (retained 30 days)
- Hourly snapshots to cloud storage
- Test restore procedures monthly

### RTO/RPO Targets
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 1 hour

### Failover Procedures
1. Detect outage via monitoring
2. Failover to standby database
3. Redirect traffic to backup region
4. Restore from backup if needed
