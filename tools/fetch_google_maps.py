#!/usr/bin/env python3
"""
Google Maps Integration
Fetches static map images and location data for area visualization.
"""

import os
import requests
import json
from typing import Dict, List, Optional, Tuple
from dotenv import load_dotenv

load_dotenv()

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
MAPS_API_BASE = "https://maps.googleapis.com/maps/api"


def geocode_area(area_code: str) -> Optional[Dict]:
    """
    Convert UK area code to latitude/longitude coordinates.
   
    Args:
        area_code: UK postcode area (e.g., "E15", "SW1")
   
    Returns:
        Dict with lat, lng, formatted_address
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: GOOGLE_MAPS_API_KEY not set")
        return None
   
    url = f"{MAPS_API_BASE}/geocode/json"
    params = {
        "address": f"{area_code}, London, UK",
        "key": GOOGLE_MAPS_API_KEY
    }
   
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
       
        if data["status"] == "OK" and len(data["results"]) > 0:
            result = data["results"][0]
            location = result["geometry"]["location"]
            return {
                "lat": location["lat"],
                "lng": location["lng"],
                "formatted_address": result["formatted_address"],
                "place_id": result.get("place_id")
            }
        else:
            print(f"Geocoding failed: {data['status']}")
            return None
           
    except Exception as e:
        print(f"Error geocoding {area_code}: {e}")
        return None


def get_static_map(
    center: Tuple[float, float],
    zoom: int = 14,
    size: str = "640x480",
    markers: Optional[List[Dict]] = None,
    maptype: str = "roadmap"
) -> Optional[str]:
    """
    Generate static map image URL.
   
    Args:
        center: (lat, lng) tuple for map center
        zoom: Zoom level (1-20)
        size: Image size "widthxheight"
        markers: List of marker dicts with lat, lng, label, color
        maptype: roadmap, satellite, hybrid, terrain
   
    Returns:
        URL to static map image
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: GOOGLE_MAPS_API_KEY not set")
        return None
   
    url = f"{MAPS_API_BASE}/staticmap"
    params = {
        "center": f"{center[0]},{center[1]}",
        "zoom": zoom,
        "size": size,
        "maptype": maptype,
        "key": GOOGLE_MAPS_API_KEY
    }
   
    # Add markers
    if markers:
        marker_params = []
        for marker in markers:
            lat = marker.get("lat")
            lng = marker.get("lng")
            label = marker.get("label", "")
            color = marker.get("color", "red")
            marker_params.append(f"color:{color}|label:{label}|{lat},{lng}")
        params["markers"] = "|".join(marker_params)
   
    # Build URL
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    return f"{url}?{query_string}"


def download_static_map(
    url: str,
    output_path: str
) -> bool:
    """
    Download static map image to file.
   
    Args:
        url: Static map URL
        output_path: Local file path to save image
   
    Returns:
        True if successful
    """
    try:
        response = requests.get(url)
        response.raise_for_status()
       
        with open(output_path, 'wb') as f:
            f.write(response.content)
       
        print(f"Map saved to {output_path}")
        return True
       
    except Exception as e:
        print(f"Error downloading map: {e}")
        return False


def get_nearby_places(
    location: Tuple[float, float],
    radius: int = 1000,
    place_type: str = "restaurant"
) -> List[Dict]:
    """
    Find nearby places using Google Places API.
   
    Args:
        location: (lat, lng) tuple
        radius: Search radius in meters
        place_type: Type of place (restaurant, school, park, etc.)
   
    Returns:
        List of places with name, address, rating
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: GOOGLE_MAPS_API_KEY not set")
        return []
   
    url = f"{MAPS_API_BASE}/place/nearbysearch/json"
    params = {
        "location": f"{location[0]},{location[1]}",
        "radius": radius,
        "type": place_type,
        "key": GOOGLE_MAPS_API_KEY
    }
   
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
       
        places = []
        for result in data.get("results", [])[:10]:  # Top 10
            places.append({
                "name": result.get("name"),
                "address": result.get("vicinity"),
                "rating": result.get("rating"),
                "types": result.get("types", []),
                "lat": result["geometry"]["location"]["lat"],
                "lng": result["geometry"]["location"]["lng"]
            })
       
        return places
       
    except Exception as e:
        print(f"Error fetching nearby places: {e}")
        return []


def calculate_distance(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    mode: str = "transit"
) -> Optional[Dict]:
    """
    Calculate distance and duration between two points.
   
    Args:
        origin: (lat, lng) tuple
        destination: (lat, lng) tuple
        mode: driving, walking, bicycling, transit
   
    Returns:
        Dict with distance and duration
    """
    if not GOOGLE_MAPS_API_KEY:
        print("Warning: GOOGLE_MAPS_API_KEY not set")
        return None
   
    url = f"{MAPS_API_BASE}/distancematrix/json"
    params = {
        "origins": f"{origin[0]},{origin[1]}",
        "destinations": f"{destination[0]},{destination[1]}",
        "mode": mode,
        "key": GOOGLE_MAPS_API_KEY
    }
   
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
       
        if data["status"] == "OK":
            element = data["rows"][0]["elements"][0]
            if element["status"] == "OK":
                return {
                    "distance": element["distance"]["text"],
                    "distance_meters": element["distance"]["value"],
                    "duration": element["duration"]["text"],
                    "duration_seconds": element["duration"]["value"]
                }
       
        return None
       
    except Exception as e:
        print(f"Error calculating distance: {e}")
        return None


def get_area_map_data(area_code: str, destination: Optional[str] = None) -> Dict:
    """
    Get comprehensive map data for an area.
   
    Args:
        area_code: UK postcode area
        destination: Optional destination for route/distance
   
    Returns:
        Dict with geocoding, map URL, nearby places, distance
    """
    result = {
        "area_code": area_code,
        "geocoding": None,
        "static_map_url": None,
        "nearby_places": {},
        "distance_to_destination": None
    }
   
    # Geocode area
    geocoding = geocode_area(area_code)
    if not geocoding:
        return result
   
    result["geocoding"] = geocoding
    center = (geocoding["lat"], geocoding["lng"])
   
    # Generate static map
    markers = [
        {"lat": center[0], "lng": center[1], "label": "A", "color": "red"}
    ]
   
    # Add destination marker if provided
    if destination:
        dest_geo = geocode_area(destination)
        if dest_geo:
            markers.append({
                "lat": dest_geo["lat"],
                "lng": dest_geo["lng"],
                "label": "B",
                "color": "blue"
            })
           
            # Calculate distance
            result["distance_to_destination"] = calculate_distance(
                center,
                (dest_geo["lat"], dest_geo["lng"]),
                mode="transit"
            )
   
    result["static_map_url"] = get_static_map(
        center,
        zoom=13,
        size="800x600",
        markers=markers
    )
   
    # Get nearby places
    place_types = ["restaurant", "school", "park", "supermarket", "hospital"]
    for place_type in place_types:
        places = get_nearby_places(center, radius=1000, place_type=place_type)
        result["nearby_places"][place_type] = len(places)
   
    return result


if __name__ == "__main__":
    import argparse
   
    parser = argparse.ArgumentParser(description="Google Maps integration")
    parser.add_argument("area_code", help="UK area code (e.g., E15)")
    parser.add_argument("--destination", help="Destination for distance calculation")
    parser.add_argument("--download", help="Download map to file path")
    parser.add_argument("--json", action="store_true", help="Output JSON format")
   
    args = parser.parse_args()
   
    # Get map data
    data = get_area_map_data(args.area_code, args.destination)
   
    # Download map if requested
    if args.download and data["static_map_url"]:
        download_static_map(data["static_map_url"], args.download)
   
    # Output
    if args.json:
        print(json.dumps(data, indent=2))
    else:
        print(f"\n{'='*60}")
        print(f"  Google Maps Data: {args.area_code}")
        print(f"{'='*60}\n")
       
        if data["geocoding"]:
            print(f"Location: {data['geocoding']['formatted_address']}")
            print(f"Coordinates: {data['geocoding']['lat']}, {data['geocoding']['lng']}")
       
        if data["static_map_url"]:
            print(f"\nStatic Map URL: {data['static_map_url']}")
       
        if data["nearby_places"]:
            print(f"\nNearby Places:")
            for place_type, count in data["nearby_places"].items():
                print(f"  - {place_type.capitalize()}: {count}")
       
        if data["distance_to_destination"]:
            dist = data["distance_to_destination"]
            print(f"\nDistance to {args.destination}:")
            print(f"  - Distance: {dist['distance']}")
            print(f"  - Duration: {dist['duration']}")
