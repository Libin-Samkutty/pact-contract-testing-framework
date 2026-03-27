#!/bin/bash
# scripts/setup.sh

# =============================================================================
# PROJECT SETUP SCRIPT
# =============================================================================
# This script sets up the complete contract testing environment:
# 1. Installs all npm dependencies
# 2. Starts Docker services (Pact Broker + DummyJSON)
# 3. Waits for services to be ready
# 4. Runs a health check
#
# Usage: ./scripts/setup.sh
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo ""
echo "============================================="
echo "  Pact Contract Testing - Setup Script"
echo "============================================="
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 18+."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    log_error "Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi
log_success "Node.js $(node -v) detected"

if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi
log_success "npm $(npm -v) detected"

if ! command -v docker &> /dev/null; then
    log_warning "Docker is not installed. Docker services will be skipped."
    SKIP_DOCKER=true
else
    log_success "Docker detected"
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    log_warning "Docker Compose is not installed. Docker services will be skipped."
    SKIP_DOCKER=true
else
    log_success "Docker Compose detected"
fi

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    log_info "Creating .env file from template..."
    cp .env.example .env
    log_success ".env file created"
else
    log_info ".env file already exists"
fi

# Create pacts directory
log_info "Creating pacts directory..."
mkdir -p pacts
echo "" > pacts/.gitkeep
log_success "pacts directory ready"

# Install dependencies
log_info "Installing root dependencies..."
npm ci

log_info "Installing consumer dependencies..."
cd consumer && npm ci && cd ..

log_info "Installing provider dependencies..."
cd provider && npm ci && cd ..

log_success "All dependencies installed"

# Start Docker services
if [ "$SKIP_DOCKER" != "true" ]; then
    log_info "Starting Docker services..."

    # Check if services are already running
    if docker ps | grep -q "pact-broker"; then
        log_warning "Pact Broker is already running"
    else
        if docker compose version &> /dev/null; then
            docker compose -f docker/docker-compose.yml up -d
        else
            docker-compose -f docker/docker-compose.yml up -d
        fi
    fi

    # Wait for services to be ready
    log_info "Waiting for services to be ready..."

    # Wait for DummyJSON
    echo -n "  Waiting for DummyJSON..."
    for i in {1..30}; do
        if curl -s http://localhost:3000/products/1 > /dev/null 2>&1; then
            echo " Ready!"
            break
        fi
        echo -n "."
        sleep 2
    done

    # Wait for Pact Broker
    echo -n "  Waiting for Pact Broker..."
    for i in {1..30}; do
        if curl -s http://localhost:9292/diagnostic/status/heartbeat > /dev/null 2>&1; then
            echo " Ready!"
            break
        fi
        echo -n "."
        sleep 2
    done

    log_success "Docker services are running"
fi

# Final health check
echo ""
log_info "Running health checks..."

if curl -s http://localhost:3000/products/1 > /dev/null 2>&1; then
    log_success "DummyJSON is healthy (http://localhost:3000)"
else
    log_warning "DummyJSON is not responding"
fi

if curl -s http://localhost:9292/diagnostic/status/heartbeat > /dev/null 2>&1; then
    log_success "Pact Broker is healthy (http://localhost:9292)"
else
    log_warning "Pact Broker is not responding"
fi

# Summary
echo ""
echo "============================================="
echo "  Setup Complete!"
echo "============================================="
echo ""
echo "Next steps:"
echo "  1. Run consumer tests:  npm run pact:consumer"
echo "  2. Publish contracts:   npm run pact:publish"
echo "  3. Verify provider:     npm run pact:provider"
echo ""
echo "Useful commands:"
echo "  npm run docker:logs    - View Docker logs"
echo "  npm run docker:down    - Stop Docker services"
echo "  npm run demo           - Run complete demo"
echo ""
echo "Services:"
echo "  Pact Broker:  http://localhost:9292"
echo "  DummyJSON:    http://localhost:3000"
echo ""
