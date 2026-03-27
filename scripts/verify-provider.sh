#!/bin/bash
# scripts/verify-provider.sh

# =============================================================================
# PROVIDER VERIFICATION SCRIPT
# =============================================================================
# Verifies the provider against all consumer contracts.
#
# Usage:
#   ./scripts/verify-provider.sh                  # Verify from local files
#   ./scripts/verify-provider.sh --from-broker    # Verify from Pact Broker
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Defaults
PROVIDER_URL="${PROVIDER_BASE_URL:-http://localhost:3000}"
BROKER_URL="${PACT_BROKER_BASE_URL:-http://localhost:9292}"
FROM_BROKER=false

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --from-broker) FROM_BROKER=true ;;
        -u|--provider-url) PROVIDER_URL="$2"; shift ;;
        -b|--broker-url) BROKER_URL="$2"; shift ;;
        -h|--help)
            echo "Usage: $0 [--from-broker] [-u provider_url] [-b broker_url]"
            exit 0
            ;;
        *) echo "Unknown parameter: $1"; exit 1 ;;
    esac
    shift
done

echo -e "${BLUE}Provider Verification${NC}"
echo "  Provider URL: $PROVIDER_URL"
echo "  From Broker:  $FROM_BROKER"
if [ "$FROM_BROKER" = true ]; then
    echo "  Broker URL:   $BROKER_URL"
fi
echo ""

# Check if provider is running
echo "Checking provider health..."
if curl -s "$PROVIDER_URL/products/1" > /dev/null 2>&1; then
    echo -e "${GREEN}Provider is healthy${NC}"
else
    echo -e "${RED}Provider is not responding at $PROVIDER_URL${NC}"
    echo "Start the provider first: docker run -p 3000:3000 ovi2406/dummyjson"
    exit 1
fi

echo ""

# Run verification
cd "$(dirname "$0")/../provider"

if [ "$FROM_BROKER" = true ]; then
    echo "Running verification from Pact Broker..."
    PACT_BROKER_URL="$BROKER_URL" \
    PROVIDER_BASE_URL="$PROVIDER_URL" \
    PACT_PUBLISH_VERIFICATION_RESULTS=true \
    npm run test:pact
else
    echo "Running verification from local files..."
    PROVIDER_BASE_URL="$PROVIDER_URL" \
    npm run test:pact
fi

echo ""
echo -e "${GREEN}✅ Provider verification complete!${NC}"
