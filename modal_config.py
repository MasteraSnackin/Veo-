"""
Modal Configuration for Veo Housing Platform
Serverless deployment of Python data processing functions
"""

import modal
import os
from pathlib import Path

# ============================================================================
# Modal Setup
# ============================================================================

# Create Modal stub
stub = modal.Stub("veo-housing")

# Define image with dependencies
image = (
    modal.Image.debian_slim()
    .pip_install(
        "requests>=2.31.0",
        "pandas>=2.1.0",
        "numpy>=1.26.0",
    )
)

# ============================================================================
# Secrets Configuration
# ============================================================================

# Define secrets (set these in Modal dashboard)
# modal secret create veo-api-keys \
#   SCANSAN_API_KEY=xxx \
#   TFL_API_KEY=xxx \
#   OPENAI_API_KEY=xxx

# ============================================================================
# Serverless Functions
# ============================================================================

@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("veo-api-keys")],
    timeout=300,  # 5 minutes
    retries=2,
)
def fetch_recommendations(
    persona: str,
    budget: int,
    location_type: str,
    destination: str = "UCL",
    max_areas: int = 5,
) -> dict:
    """
    Fetch housing recommendations based on user criteria

    Args:
        persona: User persona (student, parent, developer)
        budget: Monthly budget in GBP
        location_type: rent or buy
        destination: Target destination (for students)
        max_areas: Number of areas to recommend

    Returns:
        Dictionary with recommendations
    """
    import sys
    sys.path.append(str(Path(__file__).parent))

    from tools.fetch_scansan import get_candidate_areas
    from tools.score_areas import rank_areas

    # Get candidate areas
    areas = get_candidate_areas(budget, location_type)

    # Rank areas based on persona
    ranked = rank_areas(areas, persona, destination)

    # Return top N
    return {
        "success": True,
        "recommendations": ranked[:max_areas],
        "persona": persona,
        "budget": budget
    }


@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("veo-api-keys")],
    timeout=60,
    retries=2,
)
def fetch_area_data(area_code: str, destination: str = None) -> dict:
    """
    Fetch comprehensive data for a single area

    Args:
        area_code: UK area code (e.g., "E1", "SW1")
        destination: Optional destination for commute calculation

    Returns:
        Dictionary with all area data
    """
    import sys
    sys.path.append(str(Path(__file__).parent))

    from tools.fetch_scansan import fetch_scansan_data
    from tools.fetch_crime_data import fetch_crime_data
    from tools.fetch_schools import fetch_schools_data
    from tools.fetch_amenities import fetch_amenities_data
    from tools.fetch_tfl_commute import fetch_commute_data

    data = {
        "areaCode": area_code,
        "scansan": None,
        "crime": None,
        "schools": None,
        "amenities": None,
        "commute": None
    }

    # Fetch data from all sources (in parallel would be better)
    try:
        data["scansan"] = fetch_scansan_data(area_code)
    except Exception as e:
        print(f"Error fetching Scansan data: {e}")

    try:
        data["crime"] = fetch_crime_data(area_code)
    except Exception as e:
        print(f"Error fetching crime data: {e}")

    try:
        data["schools"] = fetch_schools_data(area_code)
    except Exception as e:
        print(f"Error fetching schools data: {e}")

    try:
        data["amenities"] = fetch_amenities_data(area_code)
    except Exception as e:
        print(f"Error fetching amenities data: {e}")

    if destination:
        try:
            data["commute"] = fetch_commute_data(area_code, destination)
        except Exception as e:
            print(f"Error fetching commute data: {e}")

    return data


@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("veo-api-keys")],
    timeout=30,
    retries=2,
)
def calculate_commute(origin: str, destination: str) -> dict:
    """
    Calculate commute time between two locations

    Args:
        origin: Starting location (area code or postcode)
        destination: Destination (area code or postcode)

    Returns:
        Dictionary with commute details
    """
    import sys
    sys.path.append(str(Path(__file__).parent))

    from tools.fetch_tfl_commute import fetch_commute_data

    return fetch_commute_data(origin, destination)


# ============================================================================
# Scheduled Jobs
# ============================================================================

@stub.function(
    image=image,
    secrets=[modal.Secret.from_name("veo-api-keys")],
    schedule=modal.Period(hours=24),
)
def cache_warmer():
    """
    Scheduled job to warm cache with common queries
    Runs daily to keep frequently accessed data fresh
    """
    print("Starting cache warming...")

    common_areas = ["E1", "E15", "SE1", "N1", "SW1", "W1", "NW1"]

    for area in common_areas:
        try:
            fetch_area_data.call(area)
            print(f"Warmed cache for {area}")
        except Exception as e:
            print(f"Failed to warm cache for {area}: {e}")

    print("Cache warming complete")


# ============================================================================
# Local Entrypoint (for testing)
# ============================================================================

@stub.local_entrypoint()
def main():
    """
    Local test entrypoint
    Usage: modal run modal_config.py
    """
    # Test recommendation fetch
    result = fetch_recommendations.call(
        persona="student",
        budget=1000,
        location_type="rent",
        destination="UCL",
        max_areas=3
    )

    print("Recommendations:")
    print(result)


# ============================================================================
# Deployment Instructions
# ============================================================================
"""
To deploy:

1. Install Modal CLI:
   pip install modal

2. Authenticate:
   modal token new

3. Create secrets in Modal dashboard:
   modal secret create veo-api-keys \
     SCANSAN_API_KEY=your_key \
     TFL_API_KEY=your_key \
     OPENAI_API_KEY=your_key

4. Deploy:
   modal deploy modal_config.py

5. Get function URLs:
   modal app list

6. Call functions:
   From Python:
     f = modal.Function.lookup("veo-housing", "fetch_recommendations")
     result = f.call(persona="student", budget=1000, ...)

   Via HTTP (after deployment):
     curl https://your-org--veo-housing-fetch-recommendations.modal.run \
       -X POST \
       -H "Content-Type: application/json" \
       -d '{"persona": "student", "budget": 1000, ...}'
"""
