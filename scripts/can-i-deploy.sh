#!/bin/bash
# scripts/can-i-deploy.sh

# =============================================================================
# CAN-I-DEPLOY CHECK
# =============================================================================
# Checks if a version can be safely deployed by verifying all contracts
# have been verified by the provider.
#
# Usage:
#   ./scripts/can-i-deploy.sh                                # Check consumer
#   ./scripts/can-i-deploy.sh -p DummyJSON -e staging        # Check provider
#
# Environment variables:
#   PACT_BROKER_BASE_URL  - Broker URL
#   APP_VERSION           - Version to check
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Defaults
BROKER_URL="${PACT_BROKER_BASE_URL:-http://localhost:9292}"
PACTICIPANT="${PACTICIPANT:-FrontendApp}"
VERSION="${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')}"
ENVIRONMENT="${DEPLOY_ENVIRONMENT:-production}"

# Parse arguments
while getopts "p:v:e:u:h" opt; do
    case $opt in
        p) PACTICIPANT="$OPTARG" ;;
        v) VERSION="$OPTARG" ;;
        e) ENVIRONMENT="$OPTARG" ;;
        u) BROKER_URL="$OPTARG" ;;
        h)
            echo "Usage: $0 [-p pacticipant] [-v version] [-e environment] [-u broker_url]"
            echo ""
            echo "Options:"
            echo "  -p  Pacticipant name (default: FrontendApp)"
            echo "  -v  Version to check (default: git SHA)"
            echo "  -e  Target environment (default: production)"
            echo "  -u  Pact Broker URL"
            exit 0
            ;;
        *)
            exit 1
            ;;
    esac
done

echo -e "${BLUE}Checking deployment safety${NC}"
echo "  Pacticipant:  $PACTICIPANT"
echo "  Version:      $VERSION"
echo "  Environment:  $ENVIRONMENT"
echo "  Broker URL:   $BROKER_URL"
echo ""

# Build command
CMD="pact-broker can-i-deploy \
    --pacticipant $PACTICIPANT \
    --version $VERSION \
    --to-environment $ENVIRONMENT \
    --broker-base-url $BROKER_URL"

# Add auth if available
if [ -n "$PACT_BROKER_TOKEN" ]; then
    CMD="$CMD --broker-token $PACT_BROKER_TOKEN"
fi

# Run check
if ! command -v pact-broker &> /dev/null; then
    echo "Installing pact-broker CLI..."
    if command -v npx &> /dev/null; then
        npx -y @pact-foundation/pact-cli can-i-deploy \
            --pacticipant "$PACTICIPANT" \
            --version "$VERSION" \
            --to-environment "$ENVIRONMENT" \
            --broker-base-url "$BROKER_URL"
        RESULT=$?
    else
        echo "Error: pact-broker CLI not found and npx not available"
        exit 1
    fi
else
    eval $CMD
    RESULT=$?
fi

echo ""

if [ $RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Safe to deploy!${NC}"
    echo "$PACTICIPANT@$VERSION can be deployed to $ENVIRONMENT"
else
    echo -e "${RED}❌ Cannot deploy!${NC}"
    echo "Contracts have not been verified for this version."
    echo "Run provider verification first."
fi

exit $RESULT
