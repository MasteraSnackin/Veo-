#!/usr/bin/env python3
"""
ONS Open Geography Integration for UK Area Boundaries
------------------------------------------------------
Fetches GeoJSON boundaries from ONS Open Geography Portal for UK postcodes and areas.
Provides detailed area boundaries for map visualization and spatial analysis.

Author: Builder (Functionality & Logic Lead)
Last Updated: 2026-02-01

ONS APIs Used:
- ONS Postcode Lookup API: https://api.postcodes.io/
- ONS Open Geography Portal: https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/
"""

import os
import sys
import json
import time
import logging
from typing import Dict, Any, Optional, List, Tuple
from datetime import datetime
import requests
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
POSTCODES_IO_API = "https://api.postcodes.io"
ONS_GEOPORTAL_BASE = "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services"
CACHE_DIR = Path(__file__).parent.parent / ".tmp" / "ons_cache"
CACHE_DURATION_DAYS = 90  # Boundaries rarely change


def get_cache_path(area_code: str, data_type: str) -> Path:
    """Generate cache file path for ONS data."""
    safe_area_code = area_code.replace(" ", "_").replace("/", "-")
    return CACHE_DIR / f"{safe_area_code}_{data_type}.json"


def load_from_cache(area_code: str, data_type: str) -> Optional[Dict[str, Any]]:
    """Load cached ONS data if still fresh."""
    cache_path = get_cache_path(area_code, data_type)
    
    if not cache_path.exists():
        return None
    
    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
        
        # Check if cache is still valid
        cache_time = datetime.fromisoformat(cached_data.get("timestamp", "2000-01-01"))
        days_old = (datetime.now() - cache_time).days
        
        if days_old < CACHE_DURATION_DAYS:
            logger.info(f"Using cached ONS data for {area_code} ({data_type}), {days_old}d old")
            return cached_data
        else:
            logger.info(f"Cache expired for {area_code} ({data_type}), {days_old}d old")
            return None
            
    except Exception as e:
        logger.warning(f"Error loading cache for {area_code}: {e}")
        return None


def save_to_cache(area_code: str, data_type: str, data: Dict[str, Any]) -> None:
    """Save ONS data to cache."""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = get_cache_path(area_code, data_type)
        
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Cached ONS data for {area_code} ({data_type})")
        
    except Exception as e:
        logger.warning(f"Error saving cache for {area_code}: {e}")


def lookup_postcode(postcode: str) -> Dict[str, Any]:
    """
    Look up postcode details using postcodes.io API (free).
    
    Args:
        postcode: UK postcode (e.g., "E1 6AN", "SW1A 1AA")
        
    Returns:
        Postcode data including codes, coordinates, and administrative areas
    """
    url = f"{POSTCODES_IO_API}/postcodes/{postcode.replace(' ', '')}"
    
    try:
        logger.info(f"Looking up postcode: {postcode}")
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("status") == 200 and data.get("result"):
            result = data["result"]
            logger.info(f"Postcode lookup successful for {postcode}")
            return {
                "postcode": result.get("postcode"),
                "latitude": result.get("latitude"),
                "longitude": result.get("longitude"),
                "country": result.get("country"),
                "region": result.get("region"),
                "admin_district": result.get("admin_district"),
                "admin_ward": result.get("admin_ward"),
                "parish": result.get("parish"),
                "parliamentary_constituency": result.get("parliamentary_constituency"),
                "codes": {
                    "admin_district": result.get("codes", {}).get("admin_district"),
                    "admin_ward": result.get("codes", {}).get("admin_ward"),
                    "parish": result.get("codes", {}).get("parish"),
                    "parliamentary_constituency": result.get("codes", {}).get("parliamentary_constituency"),
                    "ccg": result.get("codes", {}).get("ccg"),
                    "nuts": result.get("codes", {}).get("nuts"),
                    "lsoa": result.get("codes", {}).get("lsoa"),
                    "msoa": result.get("codes", {}).get("msoa"),
                }
            }
        else:
            logger.warning(f"Postcode not found: {postcode}")
            return {}
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Postcode lookup failed for {postcode}: {e}")
        return {}


def get_boundary_geojson(
    area_code: str,
    area_type: str = "msoa"
) -> Optional[Dict[str, Any]]:
    """
    Fetch GeoJSON boundary for an area from ONS Open Geography Portal.
    
    Args:
        area_code: ONS area code (e.g., LSOA code, MSOA code, LAD code)
        area_type: Type of area ("lsoa", "msoa", "ward", "district")
        
    Returns:
        GeoJSON feature collection or None if not found
    """
    # Map area types to ONS layer names (simplified)
    layer_map = {
        "lsoa": "LSOA_Dec_2021_Boundaries_EW_BFE",
        "msoa": "MSOA_Dec_2021_Boundaries_EW_BFE",
        "ward": "Wards_Dec_2021_Boundaries_UK_BFE",
        "district": "LAD_Dec_2021_Boundaries_UK_BFE"
    }
    
    layer_name = layer_map.get(area_type.lower())
    if not layer_name:
        logger.error(f"Unknown area type: {area_type}")
        return None
    
    # Build ArcGIS REST API query URL
    service_url = f"{ONS_GEOPORTAL_BASE}/{layer_name}/FeatureServer/0/query"
    
    params = {
        "where": f"MSOA21CD='{area_code}'",  # Adjust field based on area_type
        "outFields": "*",
        "outSR": "4326",  # WGS84 lat/lon
        "f": "geojson"
    }
    
    try:
        logger.info(f"Fetching {area_type} boundary for {area_code}")
        response = requests.get(service_url, params=params, timeout=30)
        response.raise_for_status()
        
        geojson = response.json()
        
        if geojson.get("features"):
            logger.info(f"Boundary fetched successfully for {area_code}")
            return geojson
        else:
            logger.warning(f"No boundary found for {area_code}")
            return None
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Boundary fetch failed for {area_code}: {e}")
        return None


def get_area_boundaries(
    postcode: str,
    include_hierarchy: bool = True
) -> Dict[str, Any]:
    """
    Get comprehensive boundary data for a postcode area.
    
    Args:
        postcode: UK postcode
        include_hierarchy: Include LSOA, MSOA, Ward, District boundaries
        
    Returns:
        Complete boundary data with GeoJSON geometries
    """
    # Check cache first
    cached = load_from_cache(postcode, "boundaries")
    if cached:
        return cached
    
    # Look up postcode to get area codes
    postcode_data = lookup_postcode(postcode)
    
    if not postcode_data:
        return {
            "postcode": postcode,
            "error": "Postcode not found",
            "timestamp": datetime.now().isoformat()
        }
    
    result = {
        "postcode": postcode,
        "location": {
            "latitude": postcode_data.get("latitude"),
            "longitude": postcode_data.get("longitude")
        },
        "administrative_areas": {
            "country": postcode_data.get("country"),
            "region": postcode_data.get("region"),
            "district": postcode_data.get("admin_district"),
            "ward": postcode_data.get("admin_ward"),
            "parish": postcode_data.get("parish"),
            "parliamentary_constituency": postcode_data.get("parliamentary_constituency")
        },
        "codes": postcode_data.get("codes", {}),
        "boundaries": {},
        "timestamp": datetime.now().isoformat(),
        "data_source": "ons_open_geography"
    }
    
    if include_hierarchy:
        # Fetch boundaries for different hierarchical levels
        # Note: This is simplified - in production, match actual ONS code field names
        
        codes = postcode_data.get("codes", {})
        
        # LSOA boundary
        if codes.get("lsoa"):
            lsoa_boundary = get_boundary_geojson(codes["lsoa"], "lsoa")
            if lsoa_boundary:
                result["boundaries"]["lsoa"] = lsoa_boundary
        
        # MSOA boundary
        if codes.get("msoa"):
            msoa_boundary = get_boundary_geojson(codes["msoa"], "msoa")
            if msoa_boundary:
                result["boundaries"]["msoa"] = msoa_boundary
        
        # Ward boundary
        if codes.get("admin_ward"):
            ward_boundary = get_boundary_geojson(codes["admin_ward"], "ward")
            if ward_boundary:
                result["boundaries"]["ward"] = ward_boundary
        
        # District boundary
        if codes.get("admin_district"):
            district_boundary = get_boundary_geojson(codes["admin_district"], "district")
            if district_boundary:
                result["boundaries"]["district"] = district_boundary
    
    # Cache the result
    save_to_cache(postcode, "boundaries", result)
    
    return result


def get_simple_boundary(postcode: str) -> Dict[str, Any]:
    """
    Get simplified boundary data (just MSOA level for performance).
    
    Args:
        postcode: UK postcode
        
    Returns:
        Simplified boundary data
    """
    # Check cache
    cached = load_from_cache(postcode, "simple_boundary")
    if cached:
        return cached
    
    # Look up postcode
    postcode_data = lookup_postcode(postcode)
    
    if not postcode_data:
        return {
            "postcode": postcode,
            "error": "Postcode not found",
            "timestamp": datetime.now().isoformat()
        }
    
    result = {
        "postcode": postcode,
        "location": {
            "latitude": postcode_data.get("latitude"),
            "longitude": postcode_data.get("longitude")
        },
        "administrative_area": postcode_data.get("admin_district"),
        "region": postcode_data.get("region"),
        "codes": {
            "msoa": postcode_data.get("codes", {}).get("msoa"),
            "lsoa": postcode_data.get("codes", {}).get("lsoa")
        },
        "boundary": None,
        "timestamp": datetime.now().isoformat(),
        "data_source": "ons_open_geography"
    }
    
    # Get MSOA boundary (medium level, good balance)
    msoa_code = postcode_data.get("codes", {}).get("msoa")
    if msoa_code:
        boundary = get_boundary_geojson(msoa_code, "msoa")
        if boundary:
            result["boundary"] = boundary
    
    # Cache
    save_to_cache(postcode, "simple_boundary", result)
    
    return result


if __name__ == "__main__":
    """
    CLI Usage:
    python tools/fetch_ons_boundaries.py "E1 6AN"
    python tools/fetch_ons_boundaries.py "E1 6AN" --full  # Include all hierarchy levels
    python tools/fetch_ons_boundaries.py "E1 6AN" --simple  # Just MSOA level
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Fetch ONS area boundaries")
    parser.add_argument("postcode", help="UK postcode (e.g., 'E1 6AN')")
    parser.add_argument("--full", action="store_true", help="Include all boundary hierarchy levels")
    parser.add_argument("--simple", action="store_true", help="Just MSOA level boundary")
    parser.add_argument("--no-cache", action="store_true", help="Skip cache and force fresh API call")
    
    args = parser.parse_args()
    
    # Handle cache bypass
    if args.no_cache:
        cache_path = get_cache_path(args.postcode, "boundaries")
        if cache_path.exists():
            cache_path.unlink()
            logger.info(f"Cleared cache for {args.postcode}")
    
    try:
        # Fetch boundaries
        if args.simple:
            boundaries = get_simple_boundary(args.postcode)
        elif args.full:
            boundaries = get_area_boundaries(args.postcode, include_hierarchy=True)
        else:
            boundaries = get_simple_boundary(args.postcode)  # Default to simple
        
        # Print results
        print(json.dumps(boundaries, indent=2, ensure_ascii=False))
        
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)
