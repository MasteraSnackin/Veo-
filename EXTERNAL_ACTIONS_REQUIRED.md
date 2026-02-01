# External Actions Required - Veo Housing Platform

**Date**: 2026-02-01 12:38 UTC  
**Status**: Backend Complete - User Actions Required for Production Deployment

---

## 🔴 Critical Actions (Required for Production)

### 1. API Keys Setup (30 minutes)

#### Required Keys (Get These First)
You need to obtain API keys from the following services:

**Critical APIs** (Cannot function without these):
- [ ] **ScanSan API Key**
  - Website: Contact ScanSan for API access
  - Cost: ~$500/month for 10k users
  - Add to `.env`: `SCANSAN_API_KEY=your_key_here`
  - Priority: **HIGHEST** - This is the primary data source

- [ ] **Anthropic Claude API Key**
  - Website: https://console.anthropic.com
  - Cost: ~$50/month for explanations
  - Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-xxxxx`
  - Priority: **HIGHEST** - Required for natural language explanations

**High Priority APIs** (Highly recommended):
- [ ] **TfL API Key**
  - Website: https://api-portal.tfl.gov.uk
  - Cost: FREE (no cost)
  - Sign up, get `app_id` and `app_key`
  - Add to `.env`: `TFL_APP_KEY=xxxxx` and `TFL_APP_ID=xxxxx`
  - Priority: **HIGH** - Commute calculations

- [ ] **Google Maps API Key**
  - Website: https://console.cloud.google.com/apis
  - Cost: $200/month free credit, then ~$100/month
  - Enable: Maps JavaScript API, Places API, Geocoding API, Distance Matrix API
  - Add to `.env`: `GOOGLE_MAPS_API_KEY=AIzaSyxxxxx`
  - Priority: **HIGH** - Maps and location services

- [ ] **Perplexity API Key** (NEW)
  - Website: https://perplexity.ai/settings/api
  - Cost: ~$30/month for research features
  - Add to `.env`: `PERPLEXITY_API_KEY=pplx-xxxxx`
  - Priority: **MEDIUM** - Real-time research enhancement

**Optional APIs** (Video generation - expensive):
- [ ] **Google Veo API Key**
  - Website: https://cloud.google.com/vertex-ai
  - Cost: Variable, on-demand video generation
  - Add to `.env`: `GOOGLE_VEO_API_KEY=xxxxx`
  - Priority: **LOW** - Optional video generation

- [ ] **OpenAI API Key** (for Sora)
  - Website: https://platform.openai.com
  - Cost: Variable, on-demand video generation
  - Add to `.env`: `OPENAI_API_KEY=sk-xxxxx`
  - Priority: **LOW** - Video generation fallback

**Setup Instructions**:
1. Copy `.env.template` to `.env`:
   ```bash
   copy .env.template .env   # Windows
   cp .env.template .env     # Linux/Mac
   ```

2. Edit `.env` and add your API keys

3. **Never commit `.env` to git** (already in `.gitignore`)

---

### 2. Modal Deployment (15-30 minutes)

**Prerequisites**:
- Python 3.9+ installed
- pip installed
- API keys configured in `.env` (from step 1)

**Steps**:

#### A. Install Modal CLI
```bash
pip install modal
```

#### B. Authenticate with Modal
```bash
modal token new
```
- This will open your browser
- Sign in with GitHub/Google
- Modal is **free for small projects** (generous free tier)

#### C. Create Modal Secrets
```bash
# Run the deployment script which handles this automatically
scripts\deploy-modal.bat   # Windows
./scripts/deploy-modal.sh  # Linux/Mac
```

Or manually:
```bash
modal secret create veo-api-keys \
  SCANSAN_API_KEY=your_key \
  TFL_API_KEY=your_key \
  ANTHROPIC_API_KEY=your_key \
  GOOGLE_MAPS_API_KEY=your_key \
  PERPLEXITY_API_KEY=your_key
```

#### D. Deploy to Modal
```bash
modal deploy modal_config.py
```

This deploys 4 serverless functions:
- `fetch_recommendations` (5min timeout, 2 retries)
- `fetch_area_data` (1min timeout, 2 retries)
- `calculate_commute` (30s timeout, 2 retries)
- `cache_warmer` (scheduled daily)

#### E. Test Deployment
```bash
modal run modal_config.py
```

Expected output: Recommendations JSON response

#### F. Get Production Endpoints
```bash
modal app list
```

Look for URLs like:
```
https://your-org--veo-housing-fetch-recommendations.modal.run
```

#### G. Update Frontend Environment
Add to `.env`:
```env
NEXT_PUBLIC_USE_MODAL=true
MODAL_ENDPOINT_URL=https://your-org--veo-housing-fetch-recommendations.modal.run
```

---

### 3. Vercel Deployment (15 minutes)

**Prerequisites**:
- Vercel account (free tier available)
- GitHub repository (optional but recommended)

**Steps**:

#### A. Install Vercel CLI (optional)
```bash
npm install -g vercel
```

#### B. Deploy via Vercel Dashboard (Recommended)
1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Set framework preset: "Next.js"
5. Set root directory: `frontend`
6. Add environment variables:
   ```
   SCANSAN_API_KEY=xxxxx
   TFL_APP_KEY=xxxxx
   TFL_APP_ID=xxxxx
   ANTHROPIC_API_KEY=xxxxx
   GOOGLE_MAPS_API_KEY=xxxxx
   PERPLEXITY_API_KEY=xxxxx
   NEXT_PUBLIC_USE_MODAL=true
   MODAL_ENDPOINT_URL=https://your-modal-url
   ```
7. Click "Deploy"

#### C. Or Deploy via CLI
```bash
cd frontend
vercel
```
Follow prompts, add environment variables when asked.

#### D. Configure Python Runtime (Important!)
Vercel needs to know about Python dependencies.

Add to `frontend/vercel.json`:
```json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "@vercel/python@3.11"
    }
  }
}
```

---

## 🟡 Recommended Actions (Enhance Production)

### 4. Vercel KV Setup (10 minutes)

**Why**: Upgrade from in-memory cache to distributed cache

**Steps**:
1. Go to Vercel dashboard → Storage → Create Database
2. Choose "KV" (Redis)
3. Select your project
4. Vercel automatically adds env vars:
   - `KV_URL`
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`

5. Update `frontend/lib/cache.ts` to use Vercel KV:
```bash
npm install @vercel/kv
```

6. Replace in-memory cache with KV:
```typescript
import { kv } from '@vercel/kv'

export async function getCached<T>(key: string): Promise<T | null> {
  return await kv.get<T>(key)
}

export async function setCache<T>(key: string, data: T, ttl: number): Promise<void> {
  await kv.set(key, data, { ex: ttl })
}
```

**Cost**: Free tier includes 256MB storage, 10k commands/day

---

### 5. Error Tracking with Sentry (15 minutes)

**Why**: Production error monitoring and alerting

**Steps**:
1. Go to https://sentry.io (free tier available)
2. Create account and project (choose "Next.js")
3. Get DSN (like `https://xxxxx@sentry.io/xxxxx`)
4. Install Sentry:
```bash
cd frontend
npx @sentry/wizard@latest -i nextjs
```

5. Add to `.env`:
```env
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx
```

6. Sentry wizard automatically configures:
   - `sentry.client.config.ts`
   - `sentry.server.config.ts`
   - Error boundaries in pages

**Cost**: Free tier includes 5k errors/month

---

### 6. Rate Limiting Setup (20 minutes)

**Why**: Prevent API abuse and manage costs

**Prerequisites**:
- Vercel KV setup (step 4) OR Upstash Redis account

**Steps**:
1. Install rate limiting library:
```bash
cd frontend
npm install @upstash/ratelimit
```

2. Create `frontend/lib/rate-limit.ts`:
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { kv } from '@vercel/kv'

export const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds
  analytics: true,
})
```

3. Add to API routes:
```typescript
import { ratelimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await ratelimit.limit(ip)
  
  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    )
  }
  
  // ... rest of handler
}
```

**Cost**: Free with Vercel KV, or Upstash free tier (10k requests/day)

---

### 7. Google Analytics/Posthog (Optional, 10 minutes)

**Why**: Track user behavior and usage patterns

**Option A: Google Analytics**
1. Go to https://analytics.google.com
2. Create property, get tracking ID (G-XXXXXXXXXX)
3. Add to `.env`:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

4. Add to `frontend/app/layout.tsx`:
```typescript
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Option B: Posthog (Recommended for Product Analytics)**
1. Go to https://posthog.com (free tier: 1M events/month)
2. Create project, get API key
3. Install:
```bash
npm install posthog-js
```

4. Add to `frontend/app/layout.tsx`:
```typescript
import { PostHogProvider } from 'posthog-js/react'
```

**Cost**: Free tier available for both

---

## 🟢 Optional Actions (Polish & Scale)

### 8. Database Setup - PostgreSQL (Optional, 1 hour)

**When**: Only needed for user accounts, saved searches, feedback

**Recommended Provider**: Supabase (free tier)

**Steps**:
1. Go to https://supabase.com
2. Create project (takes 2-3 minutes)
3. Get connection string from Settings → Database
4. Add to `.env`:
```env
DATABASE_URL=postgresql://postgres:xxxxx@db.xxxxx.supabase.co:5432/postgres
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
```

5. Install Supabase client:
```bash
npm install @supabase/supabase-js
```

6. Create tables:
```sql
-- User profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Saved searches
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  persona TEXT,
  budget INTEGER,
  location_type TEXT,
  results JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User feedback
CREATE TABLE feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  area_code TEXT,
  helpful BOOLEAN,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Cost**: Free tier includes 500MB database, 2GB bandwidth

---

### 9. Integration Testing (2-3 days)

**Why**: Ensure all API endpoints work correctly

**Tools**:
- MSW (Mock Service Worker) - Mock external APIs
- Vitest - Test runner (already configured)

**Steps**:
1. Install MSW:
```bash
cd frontend
npm install -D msw@latest
```

2. Setup MSW handlers in `frontend/__tests__/mocks/handlers.ts`:
```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('http://localhost:3000/api/recommendations', () => {
    return HttpResponse.json({
      success: true,
      recommendations: [...]
    })
  }),
]
```

3. Write integration tests in `frontend/__tests__/integration/`:
```typescript
import { describe, it, expect } from 'vitest'
import { POST } from '@/app/api/recommendations/route'

describe('/api/recommendations', () => {
  it('should return recommendations for student persona', async () => {
    const request = new Request('http://localhost:3000/api/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        persona: 'student',
        budget: 1000,
        locationType: 'rent'
      })
    })
    
    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.recommendations).toHaveLength(5)
  })
})
```

4. Run tests:
```bash
npm test
```

**Target**: 30+ integration tests, 80% coverage

---

### 10. E2E Testing (3-4 days)

**Why**: Test complete user flows in a real browser

**Tool**: Playwright (recommended over Cypress for 2026)

**Steps**:
1. Install Playwright:
```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

2. Create `frontend/__tests__/e2e/user-flow.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('complete recommendation flow', async ({ page }) => {
  // Go to homepage
  await page.goto('/')
  
  // Select student persona
  await page.getByRole('button', { name: /student/i }).click()
  
  // Fill budget slider
  await page.getByLabel(/budget/i).fill('1000')
  
  // Select location type
  await page.getByRole('radio', { name: /rent/i }).check()
  
  // Click find areas button
  await page.getByRole('button', { name: /find areas/i }).click()
  
  // Wait for recommendations to load
  await expect(page.getByText(/recommendations/i)).toBeVisible()
  
  // Verify 5 recommendations shown
  await expect(page.getByTestId('recommendation-card')).toHaveCount(5)
  
  // Click first recommendation
  await page.getByTestId('recommendation-card').first().click()
  
  // Verify detail page loads
  await expect(page.getByText(/factor breakdown/i)).toBeVisible()
})
```

3. Run E2E tests:
```bash
npx playwright test
```

4. Run with UI (interactive debugging):
```bash
npx playwright test --ui
```

**Target**: 10+ E2E tests covering critical user flows

---

### 11. CI/CD Pipeline (1 day)

**Why**: Automate testing and deployment

**Tool**: GitHub Actions (free for public repos, 2000 minutes/month for private)

**Steps**:
1. Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
        
      - name: Run unit tests
        working-directory: frontend
        run: npm test
        
      - name: Run E2E tests
        working-directory: frontend
        run: npx playwright test
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: frontend/playwright-report/

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: frontend
```

2. Add secrets to GitHub repo:
   - Go to Settings → Secrets → Actions
   - Add `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Cost**: Free for open source, or 2000 minutes/month for private repos

---

## 📋 Complete Checklist Summary

### Critical (Required)
- [ ] Get ScanSan API key (~$500/month)
- [ ] Get Claude API key (~$50/month)
- [ ] Get TfL API key (FREE)
- [ ] Get Google Maps API key (~$100/month with free credit)
- [ ] Get Perplexity API key (~$30/month)
- [ ] Configure `.env` file with all API keys
- [ ] Install Modal CLI (`pip install modal`)
- [ ] Authenticate Modal (`modal token new`)
- [ ] Deploy Modal functions (`modal deploy modal_config.py`)
- [ ] Test Modal deployment (`modal run modal_config.py`)
- [ ] Deploy frontend to Vercel

### Recommended (Highly Suggested)
- [ ] Setup Vercel KV for distributed caching (FREE tier)
- [ ] Setup Sentry for error tracking (FREE tier)
- [ ] Setup rate limiting with @upstash/ratelimit
- [ ] Add Google Analytics or Posthog (FREE tier)

### Optional (Polish)
- [ ] Setup Supabase PostgreSQL for user accounts (if needed)
- [ ] Write integration tests with MSW (30+ tests)
- [ ] Write E2E tests with Playwright (10+ tests)
- [ ] Setup CI/CD with GitHub Actions
- [ ] Get optional video API keys (Veo, Sora, LTX, Nano)

---

## 💰 Estimated Costs

### Monthly Costs (10k active users)
| Service | Tier | Cost |
|---------|------|------|
| **ScanSan** | Paid | $500 |
| **Claude API** | Pay-as-you-go | $50 |
| **Perplexity API** | Pay-as-you-go | $30 |
| **Google Maps** | $200 free credit | $100 |
| **TfL API** | Free | $0 |
| **Vercel Hosting** | Pro | $20 |
| **Vercel KV (Redis)** | Free tier | $0 |
| **Sentry** | Free tier | $0 |
| **Modal Serverless** | Pay-as-you-go | $20 |
| **Video APIs** | On-demand only | $200 (optional) |
| **Total** | | **$720-920/month** |

### Free Tier Services (No Cost)
- TfL Unified API
- data.police.uk
- Schools/Ofsted data
- OpenStreetMap
- ONS Open Geography
- postcodes.io
- Vercel KV (up to 256MB, 10k commands/day)
- Sentry (up to 5k errors/month)
- Posthog (up to 1M events/month)
- Supabase (up to 500MB database)
- GitHub Actions (2000 minutes/month)

---

## 🎯 Priority Order

**Week 1** (Critical):
1. Get API keys (ScanSan, Claude, TfL, Google Maps, Perplexity)
2. Configure `.env`
3. Deploy Modal functions
4. Deploy frontend to Vercel
5. Test production deployment

**Week 2** (Recommended):
6. Setup Vercel KV for caching
7. Setup Sentry for error tracking
8. Add rate limiting
9. Add analytics (GA or Posthog)

**Week 3-4** (Optional):
10. Write integration tests (MSW + Vitest)
11. Write E2E tests (Playwright)
12. Setup CI/CD (GitHub Actions)
13. Add Supabase for user accounts (if needed)

---

## 📞 Support Resources

**Modal**:
- Docs: https://modal.com/docs
- Discord: https://discord.gg/modal

**Vercel**:
- Docs: https://vercel.com/docs
- Discord: https://vercel.com/discord

**Next.js**:
- Docs: https://nextjs.org/docs
- Discord: https://nextjs.org/discord

**Supabase**:
- Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com

---

**Document Updated**: 2026-02-01 12:38 UTC  
**Author**: Builder (Functionality & Logic Lead)
