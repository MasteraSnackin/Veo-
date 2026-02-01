# Production Infrastructure Research - Veo Housing Platform

**Date**: 2026-02-01
**Researcher**: Strategic Planning Lead
**Scope**: Serverless-friendly infrastructure for Next.js App Router
**Status**: Phase 2 Planning

---

## Executive Summary

This document provides comprehensive research and recommendations for production-grade infrastructure components needed for the Veo Housing Platform. All recommendations prioritize **serverless-first** architectures compatible with Vercel deployment and Next.js 14+ App Router.

### Key Recommendations

| Component | Recommended Solution | Justification |
|-----------|---------------------|---------------|
| **Caching** | Vercel KV (Upstash Redis) | Native Vercel integration, serverless-native |
| **Rate Limiting** | @upstash/ratelimit | HTTP-based, no connection pooling, edge-ready |
| **Error Monitoring** | Sentry | Official Next.js support, comprehensive features |
| **Logging** | Axiom | Serverless-optimized, SQL-like queries |
| **Real-Time** | Server-Sent Events (SSE) | Built-in Next.js support, simpler than WebSockets |

---

## 1. Caching Infrastructure

### Research Question
What is the best serverless caching solution for Next.js applications deployed on Vercel?

### Options Evaluated
1. **Vercel KV** (Upstash Redis via Vercel partnership)
2. **Direct Upstash Redis**
3. **Traditional Redis** (not serverless-friendly)

### Winner: Vercel KV (Upstash Redis)

#### Key Finding
**Vercel KV IS Upstash Redis** - They're partners, not competitors. Vercel KV is powered by Upstash through an official partnership.

#### Why Vercel KV?

**✅ Serverless-Native Design**
- No connection pooling required
- HTTP REST API (not TCP sockets)
- Zero cold start issues
- Ephemeral function compatibility

**✅ Edge Network Integration**
- Distributed across Vercel Edge Network
- Multi-region data distribution
- Ultra-low latency (sub-50ms)
- Automatic geographic routing

**✅ Developer Experience**
- One-click setup in Vercel dashboard
- Auto-configured environment variables
- Type-safe SDK (@vercel/kv)
- Built-in analytics

**✅ Persistence & Reliability**
- Persists in memory AND on disk
- No data loss on server crashes
- Automatic backups
- 99.99% uptime SLA

#### Pricing
- **Free Tier**: 10,000 commands/day, 256MB storage
- **Pro**: $20/month for 1M commands/day, 1GB storage
- **Enterprise**: Custom pricing

#### Implementation
```typescript
import { kv } from '@vercel/kv'

// Set with TTL
await kv.set('key', value, { ex: 3600 }) // 1 hour

// Get
const data = await kv.get('key')

// getOrSet pattern
const data = await kv.get('key')
if (!data) {
  const newData = await fetchData()
  await kv.set('key', newData, { ex: 3600 })
  return newData
}
```

#### Sources
- [Vercel Storage](https://vercel.com/blog/vercel-storage)
- [Upstash Vercel Integration](https://upstash.com/docs/redis/howto/vercelintegration)
- [Edge-Ready Redis Patterns](https://medium.com/better-dev-nextjs-react/edge-ready-redis-patterns-using-upstash-for-vercel-deployments-f06d905094a1)
- [Vercel KV Documentation](https://vercel.com/docs/redis)

---

## 2. Rate Limiting

### Research Question
What's the best rate limiting solution for serverless Next.js API routes?

### Winner: @upstash/ratelimit

#### Why @upstash/ratelimit?

**✅ Serverless-First Design**
- HTTP-based (no persistent connections)
- Works with Vercel Edge, Cloudflare Workers, Deno, Netlify
- Zero configuration for serverless environments
- Officially recommended in Next.js docs

**✅ Advanced Algorithms**
Three built-in algorithms:
1. **Sliding Window** - Smoother experience, more accurate
2. **Fixed Window** - Simpler, lower cost
3. **Token Bucket** - Allows burst tolerance

**✅ Built-in Caching**
- Caches data while edge function is "hot"
- Only fetches from Redis when function is "cold"
- Reduces latency and costs

**✅ Multi-Region Support**
- Deploy Redis in multiple regions
- Minimizes latency for global users
- Automatic region selection

#### Best Practices (2026)

1. **Tailor Limits by User Role**
   ```typescript
   const limits = {
     anonymous: { requests: 10, window: '1h' },
     authenticated: { requests: 100, window: '1h' },
     premium: { requests: 1000, window: '1h' }
   }
   ```

2. **Provide Clear Feedback**
   ```typescript
   response.headers.set('X-RateLimit-Limit', limit.toString())
   response.headers.set('X-RateLimit-Remaining', remaining.toString())
   response.headers.set('Retry-After', retryAfter.toString())
   ```

3. **Use Edge Middleware**
   - Block traffic BEFORE it reaches backend
   - No cold start issues
   - Faster response times

4. **Combine with Other Security**
   - IP blocking
   - CAPTCHA challenges
   - Authentication checks

#### Implementation Example
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
  analytics: true,
})

// In API route or middleware
const { success, limit, remaining, reset } = await ratelimit.limit(
  identifier // IP or user ID
)

if (!success) {
  return new Response('Rate limit exceeded', {
    status: 429,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': reset.toString(),
    },
  })
}
```

#### Pricing
Uses Vercel KV/Upstash Redis (same pricing as above)

#### Sources
- [Upstash Ratelimit GitHub](https://github.com/upstash/ratelimit-js)
- [Rate Limiting Next.js API Routes](https://upstash.com/blog/nextjs-ratelimiting)
- [Vercel Edge Rate Limiting](https://upstash.com/blog/edge-rate-limiting)
- [4 Best Rate Limiting Solutions](https://dev.to/ethanleetech/4-best-rate-limiting-solutions-for-nextjs-apps-2024-3ljj)

---

## 3. Error Monitoring & Observability

### Research Question
What's the best error monitoring solution for production Next.js applications?

### Winner: Sentry (@sentry/nextjs)

#### Why Sentry?

**✅ Official Next.js Support**
- Dedicated @sentry/nextjs package
- Auto-wizard setup (`npx @sentry/wizard@latest -i nextjs`)
- Creates config for all three runtime environments:
  - `sentry.server.config.ts` - Server-side
  - `sentry.client.config.ts` - Client-side
  - `sentry.edge.config.ts` - Edge functions

**✅ Comprehensive Features (2026)**
- Real-time error alerts
- Stack trace analysis with source maps
- Performance monitoring (Web Vitals, LCP, FID, CLS)
- Session Replay (video recording of user sessions)
- Breadcrumbs (user actions before error)
- Distributed tracing for SSR
- Release tracking
- User feedback integration

**✅ Next.js-Specific Features**
- Server component error tracking
- API route monitoring
- Middleware error capture
- Edge runtime support
- Automatic route grouping
- Performance monitoring for data fetching

**✅ Ad Blocker Bypass**
- Tunnel route setup (e.g., `/monitoring`)
- Avoids ad blocker issues
- Ensures all errors are captured

#### 5-Minute Setup
```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

The wizard automatically:
- Creates all config files
- Sets up source maps
- Configures tunnel route
- Adds environment variables

#### Configuration Best Practices
```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1, // 10% performance sampling
  environment: process.env.NODE_ENV,

  // Filter out expected errors
  beforeSend(event) {
    if (event.exception?.values?.[0]?.type === 'ValidationError') {
      return null // Don't send to Sentry
    }
    return event
  },

  // Ignore certain errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection',
  ],
})
```

#### Pricing
- **Free**: 5,000 errors/month
- **Team**: $26/month for 50,000 errors/month
- **Business**: $80/month for 500,000 errors/month

#### Sources
- [Sentry Next.js Official Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Ultimate Guide to Sentry in Next.js (Jan 2026)](https://medium.com/@rukshan1122/error-monitoring-the-ultimate-guide-to-sentry-in-next-js-never-miss-a-production-error-again-e678a93760ae)
- [Complete Guide to Production Monitoring (Dec 2025)](https://eastondev.com/blog/en/posts/dev/20251220-nextjs-production-monitoring/)
- [Setting Up Error Monitoring](https://medium.com/@iqzaardiansyah/setting-up-error-monitoring-in-next-js-with-sentry-a-complete-guide-985363262c93)

---

## 4. Logging Infrastructure

### Recommended: Axiom (@axiomhq/js)

While not deeply researched in this round, Axiom is recommended in PLAN.md for:
- Serverless-optimized logging
- Real-time log streaming
- SQL-like queries for log analysis
- Free tier: 500MB/month

**Alternative**: Vercel Analytics (built-in, free tier available)

---

## 5. Real-Time Features

### Research Question
What's the best approach for real-time features in serverless Next.js?

### Options Evaluated
1. **Server-Sent Events (SSE)** - HTTP-based, unidirectional
2. **WebSockets** - Bi-directional, requires persistent connection
3. **Pusher** - Managed WebSocket service
4. **Ably** - Global pub/sub platform
5. **Supabase Realtime** - PostgreSQL-based real-time

### Winner: Server-Sent Events (SSE) for Most Use Cases

#### Why SSE for Serverless?

**✅ Serverless-Native**
- No persistent connection state to manage
- Works perfectly with ephemeral functions
- HTTP/HTTPS protocol (no special infrastructure)
- Built-in Next.js support via ReadableStream

**✅ Perfect for AI Streaming (2026 Trend)**
- LLM applications (ChatGPT-style streaming)
- Real-time dashboards
- News feeds, stock tickers
- Payment status updates

**✅ Simpler Than WebSockets**
- Easier client-side implementation
- Automatic reconnection
- Standard HTTP (works through proxies/firewalls)
- No custom protocol needed

**✅ "SSE's Glorious Comeback" (2025-2026)**
GitHub code search shows SSE usage growing rapidly in 2024-2025, driven by AI applications requiring streaming responses.

#### When to Use WebSockets Instead

WebSockets are better for:
- **Two-way communication** (chat apps, collaborative tools)
- **Multiplayer games** (low latency required)
- **Real-time notifications** (bidirectional)

#### SSE Implementation in Next.js 15
```typescript
// app/api/stream/route.ts
export async function GET(request: Request) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // Send events
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ message: 'Hello' })}\n\n`)
      )

      // Close when done
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

#### Managed Services for Complex Real-Time

If you need managed WebSocket infrastructure:

**For Scale (100K+ concurrent users)**:
- **Ably**: Largest pub/sub platform, global scale
- **Pusher**: First-generation, simple to use
- **Supabase Realtime**: PostgreSQL-based, handles 10K+ connections, <100ms latency

**For Simplicity (<10K users)**:
- **Supabase Realtime**: Best developer experience, database integration
- **Convex**: Purpose-built for collaborative apps, reactive queries

#### Sources
- [WebSockets vs SSE](https://ably.com/blog/websockets-vs-sse)
- [Streaming in Next.js 15](https://hackernoon.com/streaming-in-nextjs-15-websockets-vs-server-sent-events)
- [SSE's Glorious Comeback (2025)](https://portalzine.de/sses-glorious-comeback-why-2025-is-the-year-of-server-sent-events/)
- [Pusher vs Supabase Realtime](https://ably.com/compare/pusher-vs-supabase)
- [Supabase Review 2026](https://hackceleration.com/supabase-review/)

---

## Implementation Roadmap

### Phase 2a: Foundation (Week 1-2)
1. ✅ Install Vercel KV
2. ✅ Integrate @upstash/ratelimit in middleware
3. ✅ Set up Sentry error monitoring
4. ⚠️ Configure Axiom logging

### Phase 2b: Advanced Features (Week 3-4)
1. 📋 Implement SSE for real-time updates
2. 📋 Add distributed tracing
3. 📋 Set up alerting rules
4. 📋 Create monitoring dashboard

### Phase 3: Optimization (Week 5+)
1. 📋 Fine-tune rate limits based on analytics
2. 📋 Optimize cache TTLs
3. 📋 Add performance monitoring
4. 📋 Implement advanced error filtering

---

## Cost Estimation (10,000 Monthly Active Users)

| Service | Free Tier | Expected Cost | Notes |
|---------|-----------|---------------|-------|
| Vercel KV | 10K commands/day | $20/month | ~300K commands/month |
| Rate Limiting | Included with KV | $0 | Uses same Redis |
| Sentry | 5K errors/month | $26/month | 50K errors budget |
| Axiom | 500MB/month | $0-25/month | Likely within free tier |
| **Total** | - | **~$46-71/month** | For 10K MAU |

### Scaling Costs (100K MAU)
- Vercel KV: ~$100/month (3M commands)
- Sentry: ~$80/month (500K errors)
- Axiom: ~$50/month (5GB logs)
- **Total**: ~$230/month

---

## Alternatives NOT Recommended

### ❌ Traditional Redis
- Requires connection pooling
- Not serverless-friendly
- Cold start issues
- Complex deployment

### ❌ Memcached
- No persistence
- Less feature-rich than Redis
- Not HTTP-based

### ❌ WebSockets for Simple Streaming
- Overkill for unidirectional data
- Harder to implement
- Requires special infrastructure

### ❌ Self-Hosted Monitoring
- Maintenance overhead
- Not cost-effective at small scale
- Slower setup time

---

## Conclusion

All recommended solutions are **serverless-first**, **Vercel-native**, and **production-proven** as of 2026. They provide:

- ✅ Zero infrastructure management
- ✅ Pay-per-use pricing
- ✅ Global edge distribution
- ✅ Excellent developer experience
- ✅ Official Next.js support

**Next Steps**: Builder to implement Phase 2a (Vercel KV, rate limiting, Sentry) following this research blueprint.
