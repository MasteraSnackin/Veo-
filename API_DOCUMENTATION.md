# Veo Housing Platform - API Documentation

**Last Updated**: 2026-02-01  
**Version**: 1.0.0  
**Environment**: Development/Production Ready

---

## Overview

The Veo Housing Platform provides RESTful API endpoints for housing recommendations, area data, commute calculations, and persona management. All endpoints return structured JSON responses with comprehensive error handling.

## Base URL

```
Development: http://localhost:3000/api
Production: https://veo-housing.vercel.app/api
```

---

## Authentication

Currently, no authentication is required. Future versions will implement API key authentication.

---

## API Endpoints

### 1. POST `/api/recommendations`

Get personalized housing recommendations based on user criteria.

**Request Body**:
```typescript
{
  persona: "student" | "parent" | "developer"
  budget: number                // Monthly budget in GBP
  locationType: "rent" | "buy"
  destination?: string          // Optional (e.g., "UCL", "Imperial")
  maxAreas?: number            // Default: 5, Max: 10
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "persona": "student",
  "budget": 1000,
  "recommendations": [
    {
      "rank": 1,
      "name": "Stratford",
      "areaCode": "E15",
      "score": 85,
      "factors": {
        "safety": 80,
        "commute": 90,
        "schools": 75,
        "amenities": 88,
        "property_prices": 70,
        "nightlife": 92,
        "green_spaces": 85,
        "affordability": 95
      },
      "strengths": [
        "Excellent commute to UCL",
        "Affordable rent",
        "Great nightlife"
      ],
      "weaknesses": [
        "High property prices",
        "Limited green spaces"
      ]
    }
  ],
  "metadata": {
    "timestamp": "2026-02-01T11:00:00Z",
    "executionTimeMs": 2345,
    "sourcesUsed": ["scansan", "tfl", "crime", "schools", "amenities"],
    "cached": false
  }
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "errors": ["budget must be a positive number"]
    }
  },
  "metadata": {
    "timestamp": "2026-02-01T11:00:00Z",
    "executionTimeMs": 12,
    "sourcesUsed": []
  }
}
```

**Caching**: 1 hour TTL

---

### 2. GET `/api/areas/[code]`

Get comprehensive data for a specific area.

**Parameters**:
- `code` (path): UK area code (e.g., "E1", "SW1", "N1")
- `destination` (query, optional): Destination for commute calculation

**Example Request**:
```
GET /api/areas/E15?destination=UCL
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "areaCode": "E15",
    "name": "Stratford",
    "scansan": {
      "averagePrice": 450000,
      "priceChange": 5.2,
      "demand": "high",
      "supply": "medium",
      "insights": ["Growing area", "Good transport links"]
    },
    "crime": {
      "totalCrimes": 245,
      "crimeRate": 12.3,
      "breakdown": {
        "violence": 45,
        "burglary": 12,
        "theft": 88
      },
      "trend": "decreasing"
    },
    "schools": {
      "count": 12,
      "averageRating": 4.2,
      "outstanding": 3,
      "good": 7
    },
    "amenities": {
      "restaurants": 45,
      "cafes": 23,
      "gyms": 8,
      "parks": 5,
      "supermarkets": 6,
      "total": 87
    },
    "commute": {
      "destination": "UCL",
      "duration": 25,
      "modes": ["tube", "bus"],
      "routes": [
        {
          "mode": "tube",
          "duration": 25,
          "steps": ["Stratford → King's Cross", "Walk to UCL"]
        }
      ]
    }
  },
  "metadata": {
    "timestamp": "2026-02-01T11:00:00Z",
    "executionTimeMs": 1234,
    "sourcesUsed": ["scansan", "crime", "schools", "amenities", "commute"],
    "cached": true
  }
}
```

**Error Response** (404 Not Found):
```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Invalid area code: XYZ"
  },
  "metadata": {
    "timestamp": "2026-02-01T11:00:00Z",
    "executionTimeMs": 5,
    "sourcesUsed": []
  }
}
```

**Caching**: 24 hours TTL

---

### 3. POST `/api/commute/calculate`

Calculate commute time between two locations.

**Request Body**:
```typescript
{
  origin: string      // Area code or postcode
  destination: string // Area code or postcode
}
```

**Example Request**:
```json
{
  "origin": "E15",
  "destination": "UCL"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "destination": "UCL",
    "duration": 25,
    "modes": ["tube", "bus"],
    "routes": [
      {
        "mode": "tube",
        "duration": 25,
        "steps": [
          "Stratford → King's Cross",
          "Walk to UCL (5 min)"
        ]
      },
      {
        "mode": "bus",
        "duration": 45,
        "steps": [
          "Route 25 to Oxford Circus",
          "Route 73 to UCL"
        ]
      }
    ]
  },
  "metadata": {
    "timestamp": "2026-02-01T11:00:00Z",
    "executionTimeMs": 890,
    "sourcesUsed": ["tfl"],
    "cached": false
  }
}
```

**Caching**: 7 days TTL

---

### 4. GET `/api/personas`

Get all available persona configurations with weights and priorities.

**Response** (200 OK):
```json
{
  "success": true,
  "personas": [
    {
      "name": "student",
      "displayName": "Student",
      "description": "Affordable areas near universities with good transport and nightlife",
      "weights": {
        "safety": 0.15,
        "commute": 0.25,
        "schools": 0.05,
        "amenities": 0.15,
        "property_prices": 0.05,
        "nightlife": 0.20,
        "green_spaces": 0.05,
        "affordability": 0.30
      },
      "priorities": [
        "Affordable rent",
        "Short commute to university",
        "Active nightlife",
        "Good public transport",
        "Student-friendly areas"
      ]
    }
  ]
}
```

---

### 5. GET `/api/health`

System health check endpoint.

**Response** (200 OK):
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-01T11:00:00Z",
  "services": [
    {
      "name": "cache",
      "status": "up",
      "latency": 2
    },
    {
      "name": "python-runtime",
      "status": "up"
    }
  ],
  "uptime": 3600
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `NOT_FOUND` | 404 | Resource not found |
| `TIMEOUT_ERROR` | 504 | Request timeout (>60s) |
| `EXECUTION_ERROR` | 500 | Python script execution failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

**Current**: No rate limiting (development)  
**Production**: 100 requests/hour per IP

---

## Caching Strategy

| Endpoint | TTL | Strategy |
|----------|-----|----------|
| `/api/recommendations` | 1 hour | In-memory cache |
| `/api/areas/[code]` | 24 hours | In-memory cache |
| `/api/commute/calculate` | 7 days | In-memory cache |
| `/api/personas` | Permanent | Static data |
| `/api/health` | 1 minute | In-memory cache |

**Upgrade Path**: Vercel KV (Redis) for distributed caching in production.

---

## Data Sources

1. **Scansan API**: Property market data, pricing, demand/supply
2. **TfL API**: Transport for London commute calculations
3. **Police API**: Crime statistics by area
4. **Ofsted API**: School ratings and data
5. **OpenStreetMap**: Amenities (restaurants, cafes, parks, etc.)

---

## Python Pipeline

The backend uses Python scripts for data processing:

- **`demo_pipeline.py`**: Main recommendation pipeline
- **`tools/fetch_scansan.py`**: Property data fetching
- **`tools/fetch_tfl_commute.py`**: Commute calculations
- **`tools/fetch_crime_data.py`**: Crime statistics
- **`tools/fetch_schools.py`**: School data
- **`tools/fetch_amenities.py`**: Amenities mapping
- **`tools/score_areas.py`**: Scoring and ranking engine

**JSON Output**: All scripts support `--json` flag for structured output.

---

## Serverless Infrastructure (Modal)

**Status**: Configured, pending production deployment

**Functions**:
- `fetch_recommendations`: Main recommendation pipeline (5min timeout)
- `fetch_area_data`: Single area data fetching (1min timeout)
- `calculate_commute`: Commute calculations (30s timeout)
- `cache_warmer`: Scheduled daily cache warming

**Deployment**:
```bash
modal deploy modal_config.py
```

---

## TypeScript Types

All API responses are fully typed. See [`frontend/lib/types.ts`](frontend/lib/types.ts) for complete type definitions.

**Key Types**:
- `RecommendationRequest`
- `RecommendationResponse`
- `Recommendation`
- `AreaData`
- `CommuteData`
- `PersonaConfig`

---

## Testing

**Unit Tests**: 54 tests, 98% pass rate  
**Framework**: Vitest + @testing-library/react

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

---

## Next Steps (Phase 3)

1. Deploy Modal serverless functions
2. Implement Vercel KV distributed caching
3. Add rate limiting with @upstash/ratelimit
4. Set up Sentry error monitoring
5. Add OpenAPI/Swagger specification
6. Implement WebSocket/SSE for real-time updates
7. Integration and E2E testing

---

## Support

For issues or questions:
- Check [`PLAN.md`](PLAN.md) for implementation details
- Review [`ARCHITECTURE.md`](ARCHITECTURE.md) for system design
- See [`RESEARCH_PRODUCTION_INFRASTRUCTURE.md`](RESEARCH_PRODUCTION_INFRASTRUCTURE.md) for production setup

**Owner**: Builder (Functionality & Logic Lead)  
**Last Updated**: 2026-02-01 11:52 UTC
