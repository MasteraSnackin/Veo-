#!/bin/bash
# Modal Deployment Script for Veo Housing Platform
# This script handles the complete deployment of serverless functions to Modal

set -e  # Exit on error

echo "=================================="
echo "Modal Deployment Script"
echo "Veo Housing Platform"
echo "=================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Modal CLI is installed
if ! command -v modal &> /dev/null; then
    echo -e "${RED}Error: Modal CLI not found${NC}"
    echo "Installing Modal CLI..."
    pip install modal
fi

# Check if authenticated
echo -e "${YELLOW}Checking Modal authentication...${NC}"
if ! modal token check &> /dev/null; then
    echo -e "${YELLOW}Not authenticated. Please authenticate with Modal:${NC}"
    modal token new
fi

echo -e "${GREEN}✓ Modal CLI authenticated${NC}"
echo ""

# Check for required API keys in .env
echo -e "${YELLOW}Checking environment variables...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found${NC}"
    echo "Please create .env file with required API keys:"
    echo "  - SCANSAN_API_KEY"
    echo "  - TFL_API_KEY"
    echo "  - OPENAI_API_KEY"
    exit 1
fi

# Load .env
export $(cat .env | grep -v '^#' | xargs)

# Check for required keys
REQUIRED_KEYS=("SCANSAN_API_KEY" "TFL_API_KEY" "OPENAI_API_KEY")
MISSING_KEYS=()

for key in "${REQUIRED_KEYS[@]}"; do
    if [ -z "${!key}" ]; then
        MISSING_KEYS+=("$key")
    fi
done

if [ ${#MISSING_KEYS[@]} -ne 0 ]; then
    echo -e "${RED}Error: Missing required API keys in .env:${NC}"
    for key in "${MISSING_KEYS[@]}"; do
        echo "  - $key"
    done
    exit 1
fi

echo -e "${GREEN}✓ All required API keys found${NC}"
echo ""

# Create or update Modal secrets
echo -e "${YELLOW}Setting up Modal secrets...${NC}"
modal secret create veo-api-keys \
    SCANSAN_API_KEY="$SCANSAN_API_KEY" \
    TFL_API_KEY="$TFL_API_KEY" \
    OPENAI_API_KEY="$OPENAI_API_KEY" \
    --force 2>/dev/null || \
modal secret update veo-api-keys \
    SCANSAN_API_KEY="$SCANSAN_API_KEY" \
    TFL_API_KEY="$TFL_API_KEY" \
    OPENAI_API_KEY="$OPENAI_API_KEY"

echo -e "${GREEN}✓ Modal secrets configured${NC}"
echo ""

# Deploy Modal application
echo -e "${YELLOW}Deploying Modal functions...${NC}"
modal deploy modal_config.py

echo ""
echo -e "${GREEN}✓ Modal deployment complete${NC}"
echo ""

# Get deployment URLs
echo -e "${YELLOW}Fetching deployment URLs...${NC}"
modal app list | grep "veo-housing"

echo ""
echo "=================================="
echo -e "${GREEN}Deployment Summary${NC}"
echo "=================================="
echo ""
echo "Functions deployed:"
echo "  1. fetch_recommendations (5min timeout, 2 retries)"
echo "  2. fetch_area_data (1min timeout, 2 retries)"
echo "  3. calculate_commute (30s timeout, 2 retries)"
echo "  4. cache_warmer (scheduled daily)"
echo ""
echo "Next steps:"
echo "  1. Test functions: modal run modal_config.py"
echo "  2. Update NEXT_PUBLIC_USE_MODAL=true in .env"
echo "  3. Update python-bridge.ts with Modal endpoints"
echo "  4. Deploy frontend to Vercel"
echo ""
echo -e "${GREEN}Deployment successful!${NC}"
