#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
REPOS_DIR="$E2E_DIR/repos"
NPM_DIR="$E2E_DIR/../npm"

echo "========================================="
echo "Parseme E2E Tests"
echo "========================================="
echo ""

# Check if repos exist
if [ ! -d "$REPOS_DIR" ]; then
  echo "Repositories not found. Cloning..."
  bash "$SCRIPT_DIR/clone-repos.sh"
  echo ""
fi

# Check if npm package is built
if [ ! -d "$NPM_DIR/dist" ]; then
  echo "Building npm package..."
  cd "$NPM_DIR"
  npm run build
  cd - > /dev/null
  echo ""
fi

echo "Running E2E tests..."
echo ""

# Run tests with Node test runner
node --test "$E2E_DIR/tests/framework-examples.test.js"

echo ""
echo "========================================="
echo "E2E Tests Complete"
echo "========================================="
