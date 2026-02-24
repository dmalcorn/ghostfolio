#!/usr/bin/env bash
set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step=0
total=4

run_step() {
  step=$((step + 1))
  echo ""
  echo -e "${BLUE}[$step/$total] $1${NC}"
  echo "─────────────────────────────────────────"
}

run_step "Linting"
npm run lint

run_step "Checking formatting"
npm run format:check

run_step "Running tests"
npm test

run_step "Building for production"
npm run build:production

echo ""
echo -e "${GREEN}All CI checks passed.${NC}"
