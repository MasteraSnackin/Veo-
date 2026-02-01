# AI Integrations Status

**Last Updated**: 2026-02-01 12:21 UTC  
**Status**: Claude ✅ | Perplexity (Placeholder) | Video AIs ✅

---

## Overview

The Veo Housing Platform integrates multiple AI services for natural language processing and video generation.

---

## 1. Claude API (Anthropic) ✅ INTEGRATED

### Current Usage
**File**: [`execution/generate_explanation.py`](execution/generate_explanation.py:11-12)  
**Purpose**: Natural language explanation generation  
**API**: Anthropic Claude API

### Implementation
```python
import anthropic
from dotenv import load_dotenv

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
```

### Features
- Converts structured scores to natural language
- Persona-specific tone and focus
- Factual adherence (no hallucinations)
- Three output formats: short, medium, long

### Usage in Pipeline
Integrated in [`/api/recommendations`](frontend/app/api/recommendations/route.ts) (optional flag)

**Status**: ✅ **FULLY INTEGRATED AND OPERATIONAL**

### API Key Required
Add to `.env`:
```
ANTHROPIC_API_KEY=your_key_here
```

---

## 2. Perplexity API ⚠️ PLACEHOLDER

### Planned Usage
**Purpose**: Enhanced research and fact-checking  
**Potential Use Cases**:
- Real-time market data verification
- Area news and developments
- School rating updates
- Crime trend analysis

### Current Status
⚠️ **NOT YET IMPLEMENTED** but can be added easily

### Implementation Plan
Would be added to:
- `tools/fetch_realtime_data.py` (new file)
- API endpoint: `/api/research/[topic]` (new endpoint)

### Why Not Implemented Yet
- Current data sources (Scansan, TfL, Police, Ofsted) provide comprehensive coverage
- Perplexity would add real-time research capability (nice-to-have, not critical)
- Can be added in Phase 3 for enhanced features

---

## 3. Video Generation AIs ✅ INTEGRATED

### Multi-AI Integration
**File**: [`execution/generate_video.py`](execution/generate_video.py)  
**API Endpoint**: [`/api/video/generate`](frontend/app/api/video/generate/route.ts)

### Supported APIs

#### A. Google Veo ✅
**Status**: Primary video generation API  
**Quality**: Premium  
**Cost**: $0.15/video  
**Max Duration**: 60 seconds  
**Implementation**: Fallback chain position #1

#### B. OpenAI Sora ✅
**Status**: Fallback #2  
**Quality**: Premium  
**Cost**: $0.30/video  
**Max Duration**: 60 seconds  
**Implementation**: Activated if Veo fails

#### C. LTX Studio ✅
**Status**: Fallback #3  
**Quality**: Medium  
**Cost**: $0.10/video  
**Max Duration**: 45 seconds  
**Implementation**: Activated if Veo and Sora fail

#### D. Nano Video ✅
**Status**: Fallback #4  
**Quality**: Basic  
**Cost**: $0.05/video  
**Max Duration**: 30 seconds  
**Implementation**: Last resort fallback

### Video AI Usage in Pipeline
```python
# Automatic fallback chain
apis_to_try = ['veo', 'sora', 'ltx', 'nano']
for api in apis_to_try:
    try:
        result = generate_video_api(script, assets, api)
        break
    except:
        continue
```

**Status**: ✅ **FULLY INTEGRATED WITH AUTOMATIC FALLBACK**

### API Keys Required
Add to `.env`:
```
VEO_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here  # Also used for Sora
LTX_API_KEY=your_key_here
NANO_API_KEY=your_key_here
```

---

## 4. OpenAI (for future features)

### Current Usage
**Text Explanations**: Uses Claude (Anthropic) instead  
**Video Generation**: Sora is integrated as fallback #2

### Potential Future Usage
- GPT-4 for alternative explanation style
- DALL-E for static area visualizations
- Embeddings for semantic search

**Status**: OpenAI Sora ✅ | Other OpenAI services ⚠️ (not yet needed)

---

## AI Integration Summary

| AI Service | Purpose | Status | File | API Endpoint |
|------------|---------|--------|------|--------------|
| **Claude (Anthropic)** | Text explanations | ✅ Live | `execution/generate_explanation.py` | `/api/recommendations` |
| **Perplexity** | Real-time research | ⚠️ Planned | N/A | N/A |
| **Google Veo** | Video generation | ✅ Live | `execution/generate_video.py` | `/api/video/generate` |
| **OpenAI Sora** | Video fallback | ✅ Live | `execution/generate_video.py` | `/api/video/generate` |
| **LTX Studio** | Video fallback | ✅ Live | `execution/generate_video.py` | `/api/video/generate` |
| **Nano Video** | Video fallback | ✅ Live | `execution/generate_video.py` | `/api/video/generate` |

**Total**: 5/6 AI services integrated (Perplexity pending)

---

## Why Perplexity Not Implemented Yet

### Current Data Coverage
Existing APIs provide comprehensive coverage:
- **Property Data**: Scansan API (real-time)
- **Transport**: TfL API (real-time)
- **Crime**: UK Police API (monthly updates)
- **Schools**: Ofsted API (quarterly updates)
- **Amenities**: OpenStreetMap (regularly updated)

### Perplexity Would Add
- Real-time news about areas
- Market sentiment analysis
- Emerging neighborhood trends
- Recent development announcements

### Implementation Priority
📋 **Phase 3 Enhancement** (Not critical for MVP)

Perplexity is valuable but not essential since:
1. Core data needs are met by existing APIs
2. Claude handles explanation generation excellently
3. Video AIs provide visual content
4. Would increase API costs without proportional value add

---

## How to Add Perplexity (If Needed)

### Step 1: Create Execution Script
```python
# tools/fetch_perplexity_research.py
import os
import requests

PERPLEXITY_API_KEY = os.getenv("PERPLEXITY_API_KEY")

def research_area(area_code: str, query: str) -> dict:
    """Research area using Perplexity API"""
    response = requests.post(
        "https://api.perplexity.ai/chat/completions",
        headers={"Authorization": f"Bearer {PERPLEXITY_API_KEY}"},
        json={
            "model": "llama-3.1-sonar-large-128k-online",
            "messages": [{
                "role": "user",
                "content": f"Research {query} for area {area_code} in London"
            }]
        }
    )
    return response.json()
```

### Step 2: Create API Endpoint
```typescript
// frontend/app/api/research/route.ts
export async function POST(request: NextRequest) {
  const { areaCode, query } = await request.json()
  
  const result = await executePythonScript({
    script: getPythonScriptPath('tools/fetch_perplexity_research.py'),
    args: [areaCode, query]
  })
  
  return NextResponse.json({ research: JSON.parse(result.stdout) })
}
```

### Step 3: Add API Key
```env
PERPLEXITY_API_KEY=your_key_here
```

**Estimated Time**: 2-3 hours

---

## API Keys Setup

### Required for Current Features
```env
# Claude (for explanations)
ANTHROPIC_API_KEY=your_key_here

# Video Generation
VEO_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
LTX_API_KEY=your_key_here
NANO_API_KEY=your_key_here

# Existing APIs
SCANSAN_API_KEY=your_key_here
TFL_API_KEY=your_key_here
```

### Optional (Phase 3)
```env
# Perplexity (not yet implemented)
PERPLEXITY_API_KEY=your_key_here
```

---

## Cost Estimation

### Per Recommendation Request
- Claude explanation: ~$0.002
- Video generation: $0.05-$0.30 (if requested)
- Data APIs: Free tier sufficient

### Monthly Costs (1000 users)
- Claude: ~$20/month
- Videos (10% request rate): ~$15-$30/month
- Total AI costs: ~$35-$50/month

**Video caching (30 days) significantly reduces costs**

---

## Summary

✅ **Claude API**: Fully integrated for text explanations  
✅ **Video AIs**: 4 APIs integrated with automatic fallback  
⚠️ **Perplexity**: Planned for Phase 3 (real-time research)  

**Current AI integration is production-ready and comprehensive!**

### Integration Status: 5/6 (83%)
- Claude ✅
- Veo ✅
- Sora ✅
- LTX ✅
- Nano ✅
- Perplexity ⚠️ (Phase 3)
