#!/usr/bin/env python3
"""
Perplexity API Integration for Real-Time Area Research
-------------------------------------------------------
Fetches real-time, contextual research about areas using Perplexity's search API.
Provides current events, development news, and market insights beyond static datasets.

Author: Builder (Functionality & Logic Lead)
Last Updated: 2026-02-01
"""

import os
import sys
import json
import time
import logging
from typing import Dict, Any, Optional, List
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
PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
CACHE_DIR = Path(__file__).parent.parent / ".tmp" / "perplexity_cache"
CACHE_DURATION_HOURS = 6  # Shorter cache for real-time data


def get_perplexity_api_key() -> str:
    """Retrieve Perplexity API key from environment."""
    api_key = os.environ.get("PERPLEXITY_API_KEY")
    if not api_key:
        raise ValueError(
            "PERPLEXITY_API_KEY not found in environment. "
            "Add to .env file: PERPLEXITY_API_KEY=pplx-xxxxx"
        )
    return api_key


def get_cache_path(area_code: str, query_type: str) -> Path:
    """Generate cache file path for area research."""
    safe_area_code = area_code.replace(" ", "_").replace("/", "-")
    return CACHE_DIR / f"{safe_area_code}_{query_type}.json"


def load_from_cache(area_code: str, query_type: str) -> Optional[Dict[str, Any]]:
    """Load cached research data if still fresh."""
    cache_path = get_cache_path(area_code, query_type)
    
    if not cache_path.exists():
        return None
    
    try:
        with open(cache_path, 'r', encoding='utf-8') as f:
            cached_data = json.load(f)
        
        # Check if cache is still valid
        cache_time = datetime.fromisoformat(cached_data.get("timestamp", "2000-01-01"))
        hours_old = (datetime.now() - cache_time).total_seconds() / 3600
        
        if hours_old < CACHE_DURATION_HOURS:
            logger.info(f"Using cached Perplexity data for {area_code} ({query_type}), {hours_old:.1f}h old")
            return cached_data
        else:
            logger.info(f"Cache expired for {area_code} ({query_type}), {hours_old:.1f}h old")
            return None
            
    except Exception as e:
        logger.warning(f"Error loading cache for {area_code}: {e}")
        return None


def save_to_cache(area_code: str, query_type: str, data: Dict[str, Any]) -> None:
    """Save research data to cache."""
    try:
        CACHE_DIR.mkdir(parents=True, exist_ok=True)
        cache_path = get_cache_path(area_code, query_type)
        
        with open(cache_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Cached Perplexity data for {area_code} ({query_type})")
        
    except Exception as e:
        logger.warning(f"Error saving cache for {area_code}: {e}")


def query_perplexity(
    prompt: str,
    model: str = "llama-3.1-sonar-small-128k-online",
    max_tokens: int = 1000
) -> Dict[str, Any]:
    """
    Query Perplexity API with online search capability.
    
    Args:
        prompt: The research query
        model: Perplexity model to use (online models have real-time search)
        max_tokens: Maximum response length
        
    Returns:
        API response with content and citations
    """
    api_key = get_perplexity_api_key()
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a UK property market research assistant. "
                    "Provide concise, factual information with sources. "
                    "Focus on recent developments, trends, and context."
                )
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        "max_tokens": max_tokens,
        "temperature": 0.2,  # Lower temperature for factual responses
        "top_p": 0.9,
        "return_citations": True,
        "search_domain_filter": ["uk"],  # Focus on UK sources
        "search_recency_filter": "month"  # Recent information
    }
    
    try:
        logger.info(f"Querying Perplexity API: {prompt[:100]}...")
        response = requests.post(
            PERPLEXITY_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        
        result = response.json()
        logger.info(f"Perplexity API call successful")
        return result
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Perplexity API request failed: {e}")
        raise


def research_area_overview(area_code: str, postcode: Optional[str] = None) -> Dict[str, Any]:
    """
    Get real-time overview and recent developments for an area.
    
    Args:
        area_code: UK area code (e.g., "E1 6AN", "SW1A")
        postcode: Optional full postcode for more specific results
        
    Returns:
        Research data including recent news, developments, market trends
    """
    # Check cache first
    cached = load_from_cache(area_code, "overview")
    if cached:
        return cached
    
    location = postcode if postcode else area_code
    
    prompt = f"""
Research the {location} area in London/UK for housing and neighborhood context.

Provide:
1. Recent developments or infrastructure projects (last 12 months)
2. Notable property market trends or price movements
3. Any recent planning approvals or regeneration schemes
4. Transport or connectivity improvements
5. Community or safety developments

Keep response concise (max 200 words) and cite sources where possible.
Focus on information relevant to housing decisions.
"""
    
    try:
        response = query_perplexity(prompt)
        
        # Extract content and citations
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        citations = response.get("citations", [])
        
        result = {
            "area_code": area_code,
            "postcode": postcode,
            "query_type": "overview",
            "content": content,
            "citations": citations,
            "summary_points": extract_key_points(content),
            "timestamp": datetime.now().isoformat(),
            "data_source": "perplexity_api",
            "model": response.get("model", "unknown")
        }
        
        # Cache the result
        save_to_cache(area_code, "overview", result)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to research area {area_code}: {e}")
        # Return minimal fallback data
        return {
            "area_code": area_code,
            "postcode": postcode,
            "query_type": "overview",
            "content": f"Unable to fetch real-time research for {area_code}",
            "citations": [],
            "summary_points": [],
            "timestamp": datetime.now().isoformat(),
            "data_source": "perplexity_api",
            "error": str(e)
        }


def research_persona_insights(
    area_code: str,
    persona: str,
    postcode: Optional[str] = None
) -> Dict[str, Any]:
    """
    Get persona-specific research and insights.
    
    Args:
        area_code: UK area code
        persona: One of "student", "parent", "developer"
        postcode: Optional full postcode
        
    Returns:
        Persona-specific research data
    """
    # Check cache first
    cache_key = f"{persona}_insights"
    cached = load_from_cache(area_code, cache_key)
    if cached:
        return cached
    
    location = postcode if postcode else area_code
    
    persona_queries = {
        "student": f"""
Research {location} area for student housing considerations:
1. Nearby universities or colleges
2. Student accommodation developments
3. Nightlife and entertainment options
4. Transport links to major campuses
5. Student safety or community initiatives

Concise response (max 150 words) with UK sources.
""",
        "parent": f"""
Research {location} area for family housing considerations:
1. School catchment areas and recent Ofsted news
2. Family-friendly developments or amenities
3. Park or green space improvements
4. Child safety initiatives or community programs
5. Family housing market trends

Concise response (max 150 words) with UK sources.
""",
        "developer": f"""
Research {location} area for property investment insights:
1. Recent planning permissions or development approvals
2. Infrastructure investments (Crossrail, stations, etc.)
3. Regeneration schemes or area improvements
4. Rental yield trends or market reports
5. Investment or development opportunities

Concise response (max 150 words) with UK sources.
"""
    }
    
    prompt = persona_queries.get(persona, persona_queries["student"])
    
    try:
        response = query_perplexity(prompt, max_tokens=800)
        
        content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
        citations = response.get("citations", [])
        
        result = {
            "area_code": area_code,
            "postcode": postcode,
            "persona": persona,
            "query_type": f"{persona}_insights",
            "content": content,
            "citations": citations,
            "summary_points": extract_key_points(content),
            "timestamp": datetime.now().isoformat(),
            "data_source": "perplexity_api",
            "model": response.get("model", "unknown")
        }
        
        save_to_cache(area_code, cache_key, result)
        
        return result
        
    except Exception as e:
        logger.error(f"Failed to research {persona} insights for {area_code}: {e}")
        return {
            "area_code": area_code,
            "postcode": postcode,
            "persona": persona,
            "query_type": f"{persona}_insights",
            "content": f"Unable to fetch {persona}-specific research for {area_code}",
            "citations": [],
            "summary_points": [],
            "timestamp": datetime.now().isoformat(),
            "data_source": "perplexity_api",
            "error": str(e)
        }


def extract_key_points(content: str) -> List[str]:
    """Extract key bullet points from research content."""
    points = []
    
    # Split by newlines and look for bullet points or numbered lists
    lines = content.strip().split("\n")
    
    for line in lines:
        line = line.strip()
        
        # Check if line starts with bullet point markers or numbers
        if (line.startswith(("-", "•", "*", "·")) or 
            (len(line) > 2 and line[0].isdigit() and line[1] in (".", ")"))):
            
            # Remove the bullet/number marker
            cleaned = line.lstrip("-•*·0123456789. )").strip()
            if cleaned and len(cleaned) > 10:  # Avoid very short points
                points.append(cleaned)
    
    # If no bullet points found, try to split into sentences
    if not points and len(content) > 50:
        sentences = content.split(". ")
        points = [s.strip() + "." for s in sentences[:3] if len(s) > 20]
    
    return points[:5]  # Return max 5 key points


def get_area_research(
    area_code: str,
    persona: Optional[str] = None,
    postcode: Optional[str] = None
) -> Dict[str, Any]:
    """
    Main entry point: Get comprehensive real-time research for an area.
    
    Args:
        area_code: UK area code
        persona: Optional persona for specific insights
        postcode: Optional full postcode
        
    Returns:
        Combined research data (overview + persona insights if provided)
    """
    results = {
        "area_code": area_code,
        "postcode": postcode,
        "research_type": "comprehensive" if persona else "overview",
        "timestamp": datetime.now().isoformat()
    }
    
    # Always get general overview
    overview = research_area_overview(area_code, postcode)
    results["overview"] = overview
    
    # Get persona-specific insights if requested
    if persona:
        insights = research_persona_insights(area_code, persona, postcode)
        results["persona_insights"] = insights
    
    return results


if __name__ == "__main__":
    """
    CLI Usage:
    python tools/fetch_perplexity.py E1_6AN
    python tools/fetch_perplexity.py E1_6AN --persona student
    python tools/fetch_perplexity.py E1_6AN --persona parent --postcode "E1 6AN"
    """
    import argparse
    
    parser = argparse.ArgumentParser(description="Fetch real-time area research from Perplexity API")
    parser.add_argument("area_code", help="UK area code (e.g., E1_6AN, SW1A)")
    parser.add_argument("--persona", choices=["student", "parent", "developer"], help="Persona for specific insights")
    parser.add_argument("--postcode", help="Full postcode for more specific results")
    parser.add_argument("--no-cache", action="store_true", help="Skip cache and force fresh API call")
    
    args = parser.parse_args()
    
    # Handle cache bypass
    if args.no_cache:
        cache_path = get_cache_path(args.area_code, "overview")
        if cache_path.exists():
            cache_path.unlink()
            logger.info(f"Cleared cache for {args.area_code}")
    
    try:
        # Fetch research
        research = get_area_research(args.area_code, args.persona, args.postcode)
        
        # Print results
        print(json.dumps(research, indent=2, ensure_ascii=False))
        
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)
