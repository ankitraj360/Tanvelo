#!/usr/bin/env bash
set -e

# Tanvelo SDK Publisher Script
# Builds, tests, and publishes TypeScript SDK to npm and Python SDK to PyPI.

echo "======================================"
echo "    Tanvelo SDK Release Publisher"
echo "======================================"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# 1. TypeScript SDK (@tanvelo/sdk)
echo ""
echo "--> Building TypeScript SDK (@tanvelo/sdk)..."
cd "$ROOT_DIR/packages/sdk"
pnpm run build
pnpm test
npm pack

echo "Ready to publish @tanvelo/sdk to npm."
if [ -n "$NPM_TOKEN" ]; then
  echo "Found NPM_TOKEN. Publishing..."
  npm publish --access public
else
  echo "Tip: Run 'npm login' then 'cd packages/sdk && npm publish --access public' to publish."
fi

# 2. Python SDK (tanvelo)
echo ""
echo "--> Building Python SDK (tanvelo)..."
cd "$ROOT_DIR/packages/sdk/python"
python3 -m pip install --quiet build twine
python3 -m build
twine check dist/*

echo "Ready to publish tanvelo to PyPI."
if [ -n "$TWINE_PASSWORD" ] || [ -n "$PYPI_API_TOKEN" ]; then
  echo "Found PyPI credentials. Publishing..."
  TWINE_USERNAME="${TWINE_USERNAME:-__token__}" \
  TWINE_PASSWORD="${TWINE_PASSWORD:-$PYPI_API_TOKEN}" \
  twine upload dist/*
else
  echo "Tip: Run 'twine upload packages/sdk/python/dist/*' to upload to PyPI."
fi

echo ""
echo "Done!"
