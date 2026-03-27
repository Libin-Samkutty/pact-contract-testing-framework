#!/bin/bash
# scripts/publish-pacts.sh

# =============================================================================
# PUBLISH PACTS TO BROKER
# =============================================================================
# Publishes generated contract files to the Pact Broker with version tagging.
#
# Usage:
#   ./scripts/publish-pacts.sh                    # Use defaults
#   ./scripts/publish-pacts.sh -v 1.2.3 -b main   # Specify version and branch
#
# Environment variables:
#   PACT_BROKER_BASE_URL  - Broker URL (default: http://localhost:9292)
#   PACT_BROKER_TOKEN     - Authentication token (optional)
#   APP_VERSION           - Application version (default: git SHA)
#   GIT_BRANCH            - Git branch (default: current branch)
# =============================================================================

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Defaults
PACT_DIR="${PACT_DIR:-./pacts}"
BROKER_URL="${PACT_BROKER_BASE_URL:-http://localhost:9292}"
VERSION="${APP_VERSION:-$(git rev-parse --short HEAD 2>/dev/null || echo 'local')}"
BRANCH="${GIT_BRANCH:-$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'main')}"

# Parse arguments
while getopts "v:b:u:h" opt; do
    case $opt in
        v) VERSION="$OPTARG" ;;
        b) BRANCH="$OPTARG" ;;
        u) BROKER_URL="$OPTARG" ;;
        h)
            echo "Usage: $0 [-v version] [-b branch] [-u broker_url]"
            exit 0
            ;;
        *)
            echo "Invalid option: -$OPTARG"
            exit 1
            ;;
    esac
done

echo -e "${BLUE}Publishing Pact contracts to Broker${NC}"
echo "  Broker URL: $BROKER_URL"
echo "  Version:    $VERSION"
echo "  Branch:     $BRANCH"
echo "  Pact Dir:   $PACT_DIR"
echo ""

# Check if pact files exist
if [ ! -d "$PACT_DIR" ] || [ -z "$(ls -A "$PACT_DIR"/*.json 2>/dev/null)" ]; then
    echo -e "${RED}Error: No pact files found in $PACT_DIR${NC}"
    echo "Run consumer tests first: npm run pact:consumer"
    exit 1
fi

# List pact files
echo "Found pact files:"
ls -la "$PACT_DIR"/*.json

echo ""

# Check if pact-broker CLI is available
if ! command -v pact-broker &> /dev/null; then
    echo -e "${BLUE}Installing pact-broker CLI...${NC}"

    # Try npx first
    if command -v npx &> /dev/null; then
        npx -y @pact-foundation/pact-cli publish "$PACT_DIR" \
            --consumer-app-version "$VERSION" \
            --branch "$BRANCH" \
            --broker-base-url "$BROKER_URL" \
            --tag "$BRANCH"
    else
        # Fallback to curl-based installation
        curl -LO https://github.com/pact-foundation/pact-ruby-standalone/releases/latest/download/pact-2.4.2-linux-x86_64.tar.gz
        tar -xzf pact-2.4.2-linux-x86_64.tar.gz
        ./pact/bin/pact-broker publish "$PACT_DIR" \
            --consumer-app-version "$VERSION" \
            --branch "$BRANCH" \
            --broker-base-url "$BROKER_URL" \
            --tag "$BRANCH"
        rm -rf pact pact-2.4.2-linux-x86_64.tar.gz
    fi
else
    # Use installed pact-broker
    AUTH_ARGS=""
    if [ -n "$PACT_BROKER_TOKEN" ]; then
        AUTH_ARGS="--broker-token $PACT_BROKER_TOKEN"
    elif [ -n "$PACT_BROKER_USERNAME" ]; then
        AUTH_ARGS="--broker-username $PACT_BROKER_USERNAME --broker-password $PACT_BROKER_PASSWORD"
    fi

    pact-broker publish "$PACT_DIR" \
        --consumer-app-version "$VERSION" \
        --branch "$BRANCH" \
        --broker-base-url "$BROKER_URL" \
        --tag "$BRANCH" \
        $AUTH_ARGS
fi

echo ""
echo -e "${GREEN}✅ Contracts published successfully!${NC}"
echo ""
echo "View in Pact Broker: $BROKER_URL"
