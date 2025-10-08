#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
E2E_DIR="$(dirname "$SCRIPT_DIR")"
REPOS_DIR="$E2E_DIR/repos"

echo "Cloning framework example repositories..."
echo ""

# Create repos directory
mkdir -p "$REPOS_DIR"

# Function to clone sparse checkout (only specific subdirectory)
clone_sparse() {
  local repo_url=$1
  local repo_name=$2
  local subpath=$3
  local branch=$4
  local target_dir="$REPOS_DIR/$repo_name"

  echo "Cloning $repo_name..."

  # Remove if exists
  rm -rf "$target_dir"

  if [ "$subpath" = "." ]; then
    # Clone entire repo
    git clone --depth 1 --branch "$branch" "$repo_url" "$target_dir" 2>&1 | grep -v "Cloning into" || true
  else
    # Sparse checkout for subdirectory only
    mkdir -p "$target_dir"
    cd "$target_dir"
    git init
    git remote add origin "$repo_url"
    git config core.sparseCheckout true
    echo "$subpath/*" >> .git/info/sparse-checkout
    git fetch --depth 1 origin "$branch" 2>&1 | grep -v "remote: " || true
    git checkout "$branch" 2>&1 | grep -v "Already on" || true
    cd - > /dev/null
  fi

  echo "Success: $repo_name cloned"
  echo ""
}

# Clone NestJS cats app
clone_sparse \
  "https://github.com/nestjs/nest" \
  "nestjs-cats-app" \
  "sample/01-cats-app" \
  "master"

# Clone Express multi-router
clone_sparse \
  "https://github.com/expressjs/express" \
  "express-multi-router" \
  "examples/multi-router" \
  "master"

# Clone Fastify demo
clone_sparse \
  "https://github.com/fastify/demo" \
  "fastify-demo" \
  "." \
  "main"

echo "All repositories cloned successfully"
echo "Location: $REPOS_DIR"
