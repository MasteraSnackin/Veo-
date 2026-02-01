# Complete API Endpoints List

**Last Updated**: 2026-02-01 12:20 UTC  
**Total Endpoints**: 6  
**Status**: All Operational ✅

---

## 1. POST /api/recommendations
**File**: [`frontend/app/api/recommendations/route.ts`](frontend/app/api/recommendations/route.ts)  
**Purpose**: Get personalized housing recommendations  
**Status**: ✅ LIVE

**Request**:
```json
{
  "persona": "student" | "parent" | "developer",
  "budget": 1000,
  "locationType": "rent" | "buy",
  "destination": "UCL",
  "maxAreas": 5
}
```

**Response**:
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
      "factors": {...},
      "strengths": [...],
      "weaknesses": [...]
    }
  ]
}
```

---

## 2. GET /api/areas/[code]
**File**: [`frontend/app/api/areas/[code]/route.ts`](frontend/app/api/areas/[code]/route.ts)  
**Purpose**: Get comprehensive data for a specific area  
**Status**: ✅ LIVE

**Request**:
```
GET /api/areas/E15?destination=UCL
```

**Response**:
```json
{
  "success": true,
  "data": {
    "areaCode": "E15",
    "name": "Stratford",
    "scansan": {...},
    "crime": {...},
    "schools": {...},
    "amenities": {...},
    "commute": {...}
  }
}
```

---

## 3. POST /api/commute/calculate
**File**: [`frontend/app/api/commute/calculate/route.ts`](frontend/app/api/commute/calculate/route.ts)  
**Purpose**: Calculate commute time between two locations  
**Status**: ✅ LIVE

**Request**:
```json
{
  "origin": "E15",
  "destination": "UCL"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "destination": "UCL",
    "duration": 25,
    "modes": ["tube", "bus"],
    "routes": [...]
  }
}
```

---

## 4. POST /api/video/generate ⭐ VIDEO FUNCTION
**File**: [`frontend/app/api/video/generate/route.ts`](frontend/app/api/video/generate/route.ts)  
**Purpose**: Generate 30-60 second explainer video for an area  
**Status**: ✅ LIVE (NEW)

**Request**:
```json
{
  "areaData": {
    "rank": 1,
    "name": "Stratford",
    "areaCode": "E15",
    "score": 85,
    "factors": {
      "safety": 80,
      "commute": 90,
      "affordability": 95
    },
    "strengths": ["Excellent commute", "Affordable rent"],
    "weaknesses": ["High property prices"]
  },
  "persona": "student",
  "apiPreference": "veo",
  "duration": 45,
  "includeSubtitles": true
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "areaCode": "E15",
    "videoUrl": "https://cdn.example.com/videos/E15_student_v1.mp4",
    "thumbnailUrl": "https://cdn.example.com/thumbnails/E15.jpg",
    "durationSeconds": 45,
    "script": "Let's look at Stratford, East London...",
    "generationApi": "veo",
    "generationTimeSeconds": 120,
    "costUsd": 0.15,
    "hasSubtitles": true,
    "timestamp": "2026-02-01T12:00:00Z"
  }
}
```

**Features**:
- 🎥 Multi-API support: Veo, Sora, LTX Studio, Nano
- 🔄 Automatic fallback chain
- 💰 Cost tracking ($0.05-$0.30 per video)
- 📝 Automatic subtitle generation
- ⏱️ 30-60 second duration control
- 🎯 Persona-specific scripts
- 💾 30-day caching (expensive operation)

**Python Script**: [`execution/generate_video.py`](execution/generate_video.py)

---

## 5. GET /api/personas
**File**: [`frontend/app/api/personas/route.ts`](frontend/app/api/personas/route.ts)  
**Purpose**: Get all persona configurations  
**Status**: ✅ LIVE

**Response**:
```json
{
  "success": true,
  "personas": [
    {
      "name": "student",
      "displayName": "Student",
      "description": "Affordable areas near universities...",
      "weights": {...},
      "priorities": [...]
    }
  ]
}
```

---

## 6. GET /api/health
**File**: [`frontend/app/api/health/route.ts`](frontend/app/api/health/route.ts)  
**Purpose**: System health check  
**Status**: ✅ LIVE

**Response**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2026-02-01T12:00:00Z",
  "services": [
    {
      "name": "cache",
      "status": "up",
      "latency": 2
    }
  ],
  "uptime": 3600
}
```

---

## Video Generation Integration

### How to Use Video API

**1. Get Area Recommendation**:
```bash
curl -X POST http://localhost:3000/api/recommendations \
  -H "Content-Type: application/json" \
  -d '{"persona":"student","budget":1000,"locationType":"rent"}'
```

**2. Generate Video for Top Result**:
```bash
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "areaData": {
      "rank": 1,
      "name": "Stratford",
      "areaCode": "E15",
      "score": 85,
      "factors": {"safety": 80, "commute": 90},
      "strengths": ["Great commute"],
      "weaknesses": ["High prices"]
    },
    "persona": "student",
    "apiPreference": "veo",
    "duration": 45
  }'
```

**3. Video will be cached for 30 days** - subsequent requests return instantly

---

## Video AI APIs Integrated

| API | Quality | Cost/Video | Max Duration | Status |
|-----|---------|------------|--------------|--------|
| **Google Veo** | Premium | $0.15 | 60s | ✅ Primary |
| **OpenAI Sora** | Premium | $0.30 | 60s | ✅ Fallback |
| **LTX Studio** | Medium | $0.10 | 45s | ✅ Fallback |
| **Nano** | Basic | $0.05 | 30s | ✅ Fallback |

**Fallback Chain**: Veo → Sora → LTX → Nano (automatic)

---

## Frontend Integration Example

```typescript
// Get recommendations
const recommendations = await fetch('/api/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    persona: 'student',
    budget: 1000,
    locationType: 'rent'
  })
}).then(r => r.json())

// Generate video for top recommendation
const topArea = recommendations.recommendations[0]
const video = await fetch('/api/video/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    areaData: topArea,
    persona: 'student',
    duration: 45,
    includeSubtitles: true
  })
}).then(r => r.json())

// Display video
console.log('Video URL:', video.data.videoUrl)
console.log('Cost:', video.data.costUsd)
console.log('Generated with:', video.data.generationApi)
```

---

## Summary

✅ **6 API endpoints** fully operational  
✅ **Video generation** included with multi-AI support  
✅ **Cost optimization** with 30-day caching  
✅ **Automatic fallback** if primary API fails  
✅ **Subtitle generation** for accessibility  
✅ **Persona-specific** script generation  

**Video function is fully integrated and ready to use!** 🎥
