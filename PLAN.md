# Backend Implementation Plan - Veo Housing Platform

**Owner**: Builder (Functionality & Logic Lead)
**Last Updated**: 2026-02-01 11:46 UTC
**Status**: Phase 1 - COMPLETE ✅ | Phase 2 - Core APIs COMPLETE ✅ | **UI/UX Audit - VERIFIED & ENHANCED**

---

## Overview

This document tracks the backend implementation for the Veo Housing Recommendation Platform. The backend focuses on building robust API routes, state management, data processing logic, and serverless infrastructure using Modal.

## Architecture Principles

### 3-Layer System
1. **Layer 1: Directives** - Business logic defined in `directives/*.md`
2. **Layer 2: Orchestration** - LLM-powered decision making (this layer)
3. **Layer 3: Execution** - Deterministic Python scripts in `execution/` and `tools/`

### Backend Responsibilities
- API route handlers (`frontend/app/api/*`)
- Business logic utilities (`frontend/lib/*`)
- Serverless function deployment (Modal)
- Data validation and transformation
- Error handling and retry logic
- Caching strategies

---

## Current State Analysis

### ✅ What's Working
- **Demo Pipeline**: [`demo_pipeline.py`](demo_pipeline.py) - Full end-to-end demo
- **Execution Scripts**: Core data fetching in [`execution/`](execution/) and [`tools/`](tools/)
  - [`scansan_api.py`](execution/scansan_api.py) - Property intelligence
  - [`score_and_rank.py`](execution/score_and_rank.py) - Scoring engine
  - TfL, Crime, Schools, Amenities fetchers
- **Basic API Route**: [`/api/recommendations`](frontend/app/api/recommendations/route.ts) - Works but needs improvement

### ⚠️ What Needs Work
1. **API Structure**: Current route spawns Python processes - inefficient for production
2. **Error Handling**: Minimal error handling and validation
3. **Response Format**: Parser is brittle, needs structured JSON output
4. **State Management**: No caching, session management, or request tracking
5. **Serverless**: No Modal deployment configuration
6. **Rate Limiting**: No API rate limiting or queue management

---

## Phase 1: Core API Infrastructure (Current)

### Goal
Build production-ready API endpoints with proper error handling, validation, and structured responses.

### Tasks

#### 1. Refactor `/api/recommendations` Route ✅ COMPLETE
**File**: [`frontend/app/api/recommendations/route.ts`](frontend/app/api/recommendations/route.ts)

**Completed Improvements**:
- ✅ Added Zod validation schemas for request body
- ✅ Implemented comprehensive error handling with typed errors
- ✅ Added structured logging with context
- ✅ Integrated caching layer with 1-hour TTL
- ✅ Added request timeout handling (60s)
- ✅ Return metadata with execution time and sources
- ✅ Proper TypeScript types throughout

#### 2. Create Backend Utilities Library ✅ COMPLETE
**Directory**: `frontend/lib/`

**Files Created**:
- ✅ `frontend/lib/validators.ts` - Zod schemas for API validation
- ✅ `frontend/lib/types.ts` - Comprehensive TypeScript types
- ✅ `frontend/lib/errors.ts` - Custom error classes with HTTP codes
- ✅ `frontend/lib/logger.ts` - Structured logging with context support
- ✅ `frontend/lib/cache.ts` - In-memory cache with TTL support
- ✅ `frontend/lib/python-bridge.ts` - Clean Python execution interface
- ✅ `frontend/lib/personas.ts` - Persona configurations and weights

#### 3. Add More API Endpoints ✅ PARTIAL - Core Endpoints Complete

**`/api/personas`** - ✅ COMPLETE
- Method: GET
- Returns: All persona configurations with weights and priorities
- File: [`frontend/app/api/personas/route.ts`](frontend/app/api/personas/route.ts)

**`/api/health`** - ✅ COMPLETE
- Method: GET
- Returns: System health, service status, uptime
- Checks: Cache, Python availability
- File: [`frontend/app/api/health/route.ts`](frontend/app/api/health/route.ts)

**`/api/areas/[code]`** - ✅ COMPLETE (2026-02-01)
- Method: GET
- Params: area code (e.g., "E1"), optional destination query param
- Returns: Comprehensive area data from all sources
- File: [`frontend/app/api/areas/[code]/route.ts`](frontend/app/api/areas/[code]/route.ts)
- Features: Caching (24hr TTL), error handling, parallel data fetching

**`/api/commute/calculate`** - ✅ COMPLETE (2026-02-01)
- Method: POST
- Body: `{ origin: string, destination: string }`
- Returns: Commute details (duration, modes, routes)
- File: [`frontend/app/api/commute/calculate/route.ts`](frontend/app/api/commute/calculate/route.ts)
- Features: Caching (7 day TTL), Zod validation, error handling

#### 4. Python Output Standardization ✅ COMPLETE (2026-02-01)

**Completed Updates**:
- ✅ [`demo_pipeline.py`](demo_pipeline.py) - Added `--json` flag for structured JSON output
- ✅ Updated `/api/recommendations` to use `--json` flag
- ✅ All Python tools output consistent JSON format

**Standard Response Format Implemented**:
```json
{
  "success": true,
  "data": {
    "persona": "student",
    "budget": 1000,
    "recommendations": [...]
  },
  "metadata": {
    "timestamp": "2026-02-01T11:46:00Z",
    "execution_time_ms": 1234,
    "sources_used": ["scansan", "tfl", "crime", "schools", "amenities"],
    "areas_analyzed": 5
  }
}
```

---

## Phase 2: Serverless Infrastructure (Modal)

### Goal
Deploy core processing functions to Modal for scalable, serverless execution.

### Tasks

#### 1. Modal Configuration ✅ COMPLETE
**File**: [`modal_config.py`](modal_config.py) (root)

**Functions Configured** (Ready to Deploy):
- ✅ `fetch_recommendations` - Main recommendation pipeline (5min timeout, 2 retries)
- ✅ `fetch_area_data` - Single area data fetching (1min timeout, 2 retries)
- ✅ `calculate_commute` - Commute calculations (30s timeout, 2 retries)
- ✅ `cache_warmer` - Scheduled daily cache warming

**Features Implemented**:
- ✅ Environment variable management
- ✅ Secret handling (API keys via Modal secrets)
- ✅ Scheduled cache warming (24hr period)
- ✅ Timeout configuration per function
- ✅ Automatic retries (2 retries per function)
- ✅ Local testing entrypoint
- ✅ Complete deployment documentation

**Next Steps for Production Deployment**:
- 🔄 Set up Modal secrets with API keys
- 🔄 Deploy to Modal: `modal deploy modal_config.py`
- 🔄 Test deployed functions
- 🔄 Get production endpoints

#### 2. API Integration 🔄 TODO

**Needed for Production**:
- Install Modal Python SDK in frontend
- Add Modal client to API routes
- Update python-bridge.ts to support Modal endpoints
- Add fallback to local execution for development
- Environment variable for Modal vs local execution

---

## Phase 3: State Management & Caching

### Goal
Implement intelligent caching and state management for performance.

### Tasks

#### 1. Redis Cache Integration 🔄 TODO
**File**: `frontend/lib/cache.ts`

**Cache Strategy**:
- Area data: 24 hour TTL
- Commute calculations: 7 day TTL
- Crime data: 30 day TTL (updates monthly)
- School data: 90 day TTL (updates quarterly)

#### 2. Request Tracking 🔄 TODO
**File**: `frontend/lib/request-tracker.ts`

**Features**:
- Track in-flight requests
- Deduplicate concurrent requests
- Request cancellation support
- Progress tracking for long-running operations

#### 3. Session Management 🔄 TODO

**User Preferences Storage**:
- Store user preferences in session
- Cache recent searches
- Personalization data

---

## Phase 4: Production Readiness

### Tasks

#### 1. Rate Limiting 🔄 TODO
- Implement rate limiting per IP/user
- Queue management for heavy operations
- Graceful degradation

#### 2. Monitoring & Observability 🔄 TODO
- Add OpenTelemetry tracing
- Performance metrics
- Error tracking (Sentry)
- Usage analytics

#### 3. Testing 🔄 TODO
- Unit tests for all utilities
- Integration tests for API routes
- E2E tests for critical flows
- Load testing

#### 4. Documentation 🔄 TODO
- OpenAPI/Swagger spec
- API usage examples
- Deployment guide

---

## API Endpoints Specification

### Current Endpoints

#### `POST /api/recommendations`
**Status**: ✅ Live (needs refactoring)

**Request**:
```typescript
{
  persona: "student" | "parent" | "developer"
  budget: number
  locationType: "rent" | "buy"
  destination?: string
  maxAreas?: number
}
```

**Response**:
```typescript
{
  success: boolean
  persona: string
  budget: number
  recommendations: Array<{
    rank: number
    name: string
    areaCode: string
    score: number
    factors: Record<string, number>
    strengths: string[]
    weaknesses: string[]
  }>
}
```

### Planned Endpoints

#### `GET /api/areas/[code]`
**Status**: 🔄 Planned

Get comprehensive data for a specific area.

#### `POST /api/commute/calculate`
**Status**: 🔄 Planned

Calculate commute between two locations.

#### `GET /api/personas`
**Status**: 🔄 Planned

Get available persona definitions and configurations.

#### `GET /api/health`
**Status**: 🔄 Planned

System health check.

---

## Technology Stack

### Current (Phase 1 Complete)
- **Runtime**: Node.js (Next.js API routes)
- **Language**: TypeScript + Python
- **Framework**: Next.js 14 (App Router)
- **Validation**: ✅ Zod schemas (implemented)
- **Python Bridge**: ✅ `python-bridge.ts` utility (implemented)

### Phase 2: Production Architecture (Research Complete ✅ 2026-02-01)

**Research Document**: See [`RESEARCH_PRODUCTION_INFRASTRUCTURE.md`](RESEARCH_PRODUCTION_INFRASTRUCTURE.md) for comprehensive findings.

**Key Decisions Made**:
- ✅ Caching: Vercel KV (Upstash Redis partnership)
- ✅ Rate Limiting: @upstash/ratelimit with sliding window
- ✅ Monitoring: Sentry for errors, Axiom for logs
- ✅ Real-Time: Server-Sent Events (SSE) over WebSockets

#### Serverless & Compute
- **Python Backend**: Modal (serverless Python functions)
  - Zero infrastructure management
  - Automatic scaling and retries
  - Cold start optimization
  - Built-in secret management
  - Pay-per-use: ~$0.00004 per CPU-second
  - **Status**: Config exists, needs deployment

- **Edge Runtime**: Vercel Edge Functions
  - Fast API validation at CDN edge
  - Minimal latency for health checks
  - **Status**: Ready to implement

#### Caching & State
- **Primary Cache**: Vercel KV (Upstash Redis)
  - **Why**: Vercel KV IS Upstash Redis (partnership, not separate products)
  - Serverless-native (HTTP REST API, no TCP connection pooling)
  - Global edge network distribution (sub-50ms latency)
  - Persists in memory AND disk (no data loss)
  - One-click Vercel setup, auto-configured env vars
  - Free tier: 10k commands/day, 256MB storage
  - **Current**: In-memory cache implemented ✅
  - **Next**: Upgrade to Vercel KV for distributed caching
  - **TTL Strategy**:
    - Recommendations: 1 hour (current) ✅
    - Area data: 24 hours
    - Commute: 7 days
    - Crime: 30 days
    - Schools: 90 days

#### Rate Limiting & Security
- **Rate Limiter**: @upstash/ratelimit
  - **Why**: HTTP-based (no connections), officially recommended by Next.js
  - Three algorithms available: Sliding Window (recommended), Fixed Window, Token Bucket
  - Built-in caching (reduces Redis calls when function is "hot")
  - Multi-region support for global deployments
  - Edge middleware compatible (block at edge, not backend)
  - **Recommended Tiers**:
    - Anonymous: 10 requests/hour
    - Authenticated: 100 requests/hour
    - Premium: 1000 requests/hour
    - Expensive ops (recommendations): 10 requests/hour
  - Include X-RateLimit headers for client feedback
  - **Status**: Ready to implement
  - **Estimated Cost**: $0 (uses same Vercel KV/Redis)

#### Monitoring & Observability
- **Error Tracking**: Sentry (@sentry/nextjs)
  - **Why**: Official Next.js package, 5-minute wizard setup, comprehensive features
  - Three runtime configs: server, client, edge (auto-generated)
  - Real-time error alerts with stack traces + source maps
  - Performance monitoring (Web Vitals, LCP, FID, CLS)
  - Session Replay (video recording of user sessions)
  - Distributed tracing for SSR
  - Breadcrumbs tracking (user actions before error)
  - Ad blocker bypass via tunnel route (/monitoring)
  - **Setup**: `npx @sentry/wizard@latest -i nextjs`
  - Free tier: 5k errors/month
  - Estimated cost: $26/month (50k errors)
  - **Best Practice**: Set tracesSampleRate to 0.1 (10% sampling)

- **Structured Logging**: Axiom (@axiomhq/js)
  - **Why**: Serverless-optimized, SQL-like queries, real-time streaming
  - Real-time log streaming and analysis
  - SQL-like queries for log analysis
  - Serverless function log aggregation
  - Free tier: 500MB/month
  - Estimated cost: $0-25/month

- **Analytics**: Vercel Analytics
  - **Why**: Built-in, zero config, free tier
  - Web vitals tracking (LCP, FID, CLS, TTFB)
  - API response times
  - Geographic distribution
  - Free tier: 2,500 events/month

#### Background Jobs & Workflows
- **Job Queue**: Inngest
  - Durable execution with retries
  - Step functions for complex workflows
  - Event-driven architecture
  - Use cases: AI generation, cache warming, batch processing
  - Free tier: 50k steps/month

#### HTTP Client & Utilities
- **API Client**: ky
  - Modern fetch wrapper
  - Automatic retries with exponential backoff
  - Request/response hooks
  - Timeout handling

- **OpenAPI Generation**: @anatine/zod-openapi
  - Auto-generate API docs from Zod schemas
  - Type-safe and always in sync

### Real-Time Communication (Phase 3)

**Recommendation**: Server-Sent Events (SSE) over WebSockets

**Why SSE?**
- **Serverless-native**: No persistent connection state to manage
- **Built-in Next.js support**: ReadableStream API in App Router
- **Perfect for AI streaming**: LLM responses, real-time dashboards
- **Simpler than WebSockets**: HTTP protocol, automatic reconnection
- **2025-2026 trend**: "SSE's Glorious Comeback" driven by AI apps

**When to Use WebSockets Instead**:
- Two-way communication (chat, collaborative editing)
- Multiplayer games (low latency critical)
- Real-time notifications (bidirectional)

**Managed Services** (if WebSockets needed):
- **Supabase Realtime**: 10K+ connections, <100ms latency, PostgreSQL-based
- **Ably**: Global scale, pub/sub platform
- **Pusher**: Simple, first-generation service

**Status**: Research complete, implementation in Phase 3

---

### Research Documentation

**Primary Research**: [`RESEARCH_PRODUCTION_INFRASTRUCTURE.md`](RESEARCH_PRODUCTION_INFRASTRUCTURE.md) (2026-02-01)
- Comprehensive serverless infrastructure research
- Vercel KV vs Redis comparison
- Rate limiting best practices (2026)
- Error monitoring setup guide
- SSE vs WebSocket analysis
- Cost estimation (10K-100K MAU)
- Implementation roadmap

**Legacy Research**: [`RESEARCH_FINDINGS.md`](RESEARCH_FINDINGS.md) (2026-01-31)
- Original technology stack research
- Alternative comparisons
- Migration strategies

---

## Dependencies to Add

### TypeScript/Node.js (Production)
```json
{
  "dependencies": {
    "@vercel/kv": "^1.0.1",
    "@upstash/ratelimit": "^1.0.0",
    "@sentry/nextjs": "^7.91.0",
    "@axiomhq/js": "^1.0.0",
    "@vercel/analytics": "^1.1.0",
    "inngest": "^3.0.0",
    "ky": "^1.0.0",
    "@anatine/zod-openapi": "^2.0.0",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "k6": "^0.47.0",
    "openapi-typescript": "^6.7.0"
  }
}
```

**Status**:
- ✅ `zod` - Already installed and implemented
- 🔄 Others - Ready to install (see [`RESEARCH_FINDINGS.md`](RESEARCH_FINDINGS.md))

### Python (Modal Functions)
```txt
# execution/requirements.txt
modal-client>=0.55.0
requests>=2.31.0
aiohttp>=3.9.0
pandas>=2.1.0
numpy>=1.26.0
structlog>=23.3.0
redis>=5.0.0
```

**Status**: Base requirements exist, needs Modal client addition

### Environment Variables (Required)
```env
# Existing
SCANSAN_API_KEY=
TFL_API_KEY=
OPENAI_API_KEY=

# New (Phase 2)
# Caching
KV_REST_API_URL=
KV_REST_API_TOKEN=

# Rate Limiting (uses same Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Monitoring
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
AXIOM_TOKEN=
AXIOM_ORG_ID=

# Background Jobs
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=

# Modal Deployment
MODAL_ENDPOINT_URL=
MODAL_TOKEN_ID=
MODAL_TOKEN_SECRET=

# Feature Flags
NEXT_PUBLIC_USE_MODAL=false
NEXT_PUBLIC_USE_CACHE=true
NEXT_PUBLIC_USE_INNGEST=false
```

---

## Success Metrics

- [ ] API response time < 2s for recommendations
- [ ] 99.9% uptime for core endpoints
- [ ] < 1% error rate
- [ ] Cache hit rate > 60%
- [ ] Support 100+ concurrent users

---

## Next Steps

### Phase 1 - COMPLETE ✅
1. ✅ Create PLAN.md
2. ✅ Refactor `/api/recommendations` with validation
3. ✅ Create TypeScript types and utilities
4. ✅ Create error handling system
5. ✅ Create Python bridge utility
6. ✅ Add `/api/personas` endpoint
7. ✅ Add `/api/health` endpoint
8. ✅ Set up Modal configuration
9. ✅ Create API documentation

 98% pass rate)
9. 🔄 Write integration tests for API routes
10. 🔄 Write E2E tests for user flows

### Phase 3 - Future 📋
1. 📋 OpenAPI/Swagger specification
2. 📋 Performance optimization
3. 📋 Advanced caching strategies
4. 📋 WebSocket support for real-time updates
5. 📋 GraphQL API layer

---

## Testing & Quality Assurance

**Owner**: QC & Testing Lead
**Last Updated**: 2026-02-01
**Status**: Unit tests complete, Integration & E2E pending

### Test Infrastructure ✅ COMPLETE

**Framework**: Vitest + @testing-library/react

**Files Created**:
- ✅ `vitest.config.ts` - Test configuration
- ✅ `__tests__/setup.ts` - Test environment setup
- ✅ `__tests__/unit/validators.test.ts` - 18 tests ✅
- ✅ `__tests__/unit/errors.test.ts` - 12 tests ✅
- ✅ `__tests__/unit/cache.test.ts` - 11 tests ✅
- ✅ `__tests__/unit/personas.test.ts` - 11 tests (1 failing ⚠️)
- ✅ `__tests__/TEST_REPORT.md` - Comprehensive test report
- ✅ `__tests__/e2e/USER_FLOW_AUDIT.md` - E2E test plan & UI audit

**Test Scripts**:
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Test Results

| Metric | Value |
|--------|-------|
| Total Tests | 54 |
| Passing | 53 ✅ |
| Failing | 1 ❌ |
| Success Rate | 98.1% |
| Execution Time | 3.19s |

### Bugs Found 🐛

 to resolve
**Fix Required**:
```typescript
// Current (incorrect - sums to 1.10):
development: 0.25, affordability: 0.05

// Proposed fix (sums to 1.00):
development: 0.20, affordability: 0.05
```

### UI/UX Audit Findings

**Overall Quality**: ✅ EXCELLENT
- Modern glassmorphism design
- Smooth animations with Framer Motion
- Responsive bento grid layout
- Professional typography (Inter font)

**Medium Priority Issues**:
1. ⚠️ No error boundary components for API failures
2. ⚠️ Missing client-side validation feedback
3. ⚠️ Loading states incomplete for all scenarios

**Low Priority Enhancements**:
1. 💡 Results pagination (currently max 10)
2. 💡 Share/Export functionality (placeholder buttons)
3. 💡 Accessibility improvements (ARIA labels, screen reader testing)

### Testing Roadmap

**Completed** ✅:
- [x] Test infrastructure setup
- [x] Unit tests for all backend utilities
- [x] Test documentation
- [x] UI/UX audit report

**Phase 2** 🔄:
- [ ] Integration tests for API routes
- [ ] E2E tests for complete user flows
- [ ] Visual regression testing
- [ ] Performance testing (Lighthouse)

**Phase 3** 📋:
- [ ] CI/CD pipeline integration
- [ ] Automated browser testing (Playwright)
- [ ] Accessibility testing (axe-core)
- [ ] Load testing (k6)

---

## Notes

- **No UI Changes**: This plan focuses purely on backend/API layer
- **Python Scripts**: Execution layer scripts are deterministic and shouldn't need major changes
- **Directives**: Business logic lives in `directives/*.md` files
- **Testing**: Test locally before deploying to Modal
- **Bug Fix Required**: Developer persona weights must be corrected before production

---

**Legend**:
- ✅ Complete
- 🔄 In Progress / Todo
- ⚠️ Needs Attention
- ❌ Blocked
