# Google Maps Integration

**Date Added**: 2026-02-01 12:23 UTC  
**Status**: Fully Integrated ✅

---

## Overview

Google Maps API has been integrated for static map generation, geocoding, nearby places, and distance calculations.

---

## Implementation

### Python Script
**File**: [`tools/fetch_google_maps.py`](tools/fetch_google_maps.py) (371 lines)

**Features**:
- ✅ Geocoding (area code → lat/lng)
- ✅ Static map generation with custom markers
- ✅ Nearby places search (restaurants, schools, parks, etc.)
- ✅ Distance/duration calculations
- ✅ Map image download capability

### API Endpoint
**File**: [`frontend/app/api/maps/area/route.ts`](frontend/app/api/maps/area/route.ts) (130 lines)

**Endpoint**: `POST /api/maps/area`

**Request**:
```json
{
  "areaCode": "E15",
  "destination": "UCL",
  "downloadMap": false
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "areaCode": "E15",
    "geocoding": {
      "lat": 51.5465,
      "lng": -0.0014,
      "formattedAddress": "Stratford, London E15, UK"
    },
    "staticMapUrl": "https://maps.googleapis.com/maps/api/staticmap?...",
    "nearbyPlaces": {
      "restaurant": 45,
      "school": 12,
      "park": 5,
      "supermarket": 6,
      "hospital": 2
    },
    "distanceToDestination": {
      "distance": "5.2 km",
      "distanceMeters": 5200,
      "duration": "25 mins",
      "durationSeconds": 1500
    }
  }
}
```

### Video Integration
**File**: [`execution/generate_video.py`](execution/generate_video.py:104-139)

Google Maps is now integrated into video asset generation:
- Automatically generates static map with area marker
- Downloads map image to `.tmp/video_assets_{area_code}/map.png`
- Used as visual background in video explainers

---

## Usage Examples

### CLI Usage
```bash
# Basic area geocoding
python tools/fetch_google_maps.py E15 --json

# With destination and distance
python tools/fetch_google_maps.py E15 --destination UCL --json

# Download static map
python tools/fetch_google_maps.py E15 --download ./map.png
```

### API Usage
```bash
# Get map data
curl -X POST http://localhost:3000/api/maps/area \
  -H "Content-Type: application/json" \
  -d '{"areaCode":"E15","destination":"UCL"}'
```

### Frontend Integration
```typescript
const mapsData = await fetch('/api/maps/area', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    areaCode: 'E15',
    destination: 'UCL'
  })
}).then(r => r.json())

// Use static map URL in image tag
<img src={mapsData.data.staticMapUrl} alt="Area Map" />

// Display nearby places
console.log('Restaurants nearby:', mapsData.data.nearbyPlaces.restaurant)
```

---

## API Features

### 1. Geocoding
Converts UK area codes to precise coordinates:
```python
geocode_area("E15")
# Returns: {"lat": 51.5465, "lng": -0.0014, ...}
```

### 2. Static Map Generation
Creates custom map images with markers:
```python
get_static_map(
    center=(51.5465, -0.0014),
    zoom=13,
    size="800x600",
    markers=[
        {"lat": 51.5465, "lng": -0.0014, "label": "A", "color": "red"}
    ]
)
# Returns: Google Maps Static API URL
```

### 3. Nearby Places
Finds points of interest within radius:
```python
get_nearby_places(
    location=(51.5465, -0.0014),
    radius=1000,
    place_type="restaurant"
)
# Returns: List of nearby restaurants with ratings
```

### 4. Distance Calculation
Calculates travel time between points:
```python
calculate_distance(
    origin=(51.5465, -0.0014),
    destination=(51.5246, -0.1340),
    mode="transit"
)
# Returns: {"distance": "5.2 km", "duration": "25 mins"}
```

---

## Integration Points

### 1. Area Detail Pages
Use `/api/maps/area` to show:
- Interactive map of area
- Nearby amenities visualization
- Distance to workplace/school

### 2. Video Generation
Maps automatically included in video assets:
- Static map as background
- Markers for area and destination
- Visual context for explanations

### 3. Recommendations Display
Show maps for top recommendations:
- Quick visual overview
- Location context
- Nearby places summary

---

## Configuration

### API Key Setup
Add to `.env`:
```
GOOGLE_MAPS_API_KEY=your_api_key_here
```

### Get API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable APIs:
   - Maps Static API
   - Geocoding API
   - Places API
   - Distance Matrix API
3. Create API key
4. Restrict by HTTP referrer (production)

### Cost Estimation
Google Maps pricing (as of 2024):
- Static Maps: $2 per 1,000 requests
- Geocoding: $5 per 1,000 requests
- Places: $17 per 1,000 requests
- Distance Matrix: $5 per 1,000 requests

**With caching (7 days)**: ~$50-100/month for 10K users

---

## Caching Strategy

**Cache Duration**: 7 days (same as commute data)

**Rationale**:
- Maps don't change frequently
- Reduces API costs significantly
- Nearby places relatively stable

**Cache Key**: `maps:{areaCode}:{destination}`

---

## Error Handling

### Missing API Key
If `GOOGLE_MAPS_API_KEY` not set:
- Warning logged
- Functions return None
- Graceful degradation (app continues working)

### API Failures
- Automatic retry logic (inherent in python-bridge)
- Cached responses used when available
- Error logged with context

---

## Testing

### Test Geocoding
```bash
python tools/fetch_google_maps.py E15 --json
```

### Test with Destination
```bash
python tools/fetch_google_maps.py E15 --destination UCL --json
```

### Test API Endpoint
```bash
curl -X POST http://localhost:3000/api/maps/area \
  -H "Content-Type: application/json" \
  -d '{"areaCode":"E15","destination":"UCL"}'
```

### Expected Output
```json
{
  "area_code": "E15",
  "geocoding": {...},
  "static_map_url": "https://maps.googleapis.com/...",
  "nearby_places": {
    "restaurant": 45,
    "school": 12
  }
}
```

---

## Future Enhancements

### Phase 3 Possibilities
1. **Directions API**: Step-by-step navigation
2. **Street View**: 360° area visualization
3. **Real-time Traffic**: Live commute times
4. **Place Details**: Reviews, photos, opening hours
5. **Interactive Maps**: Frontend Google Maps SDK

---

## Summary

✅ **Python Script**: Full Google Maps API integration  
✅ **API Endpoint**: `/api/maps/area` operational  
✅ **Video Integration**: Maps used in video assets  
✅ **Caching**: 7-day TTL for cost optimization  
✅ **Error Handling**: Graceful degradation  

**Google Maps fully integrated and production-ready!** 🗺️
