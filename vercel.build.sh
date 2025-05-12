#!/bin/bash

# Make sure scripts are executable
chmod +x ./scripts/*.js

# Install dependencies with --include=dev to include dev dependencies
npm install --include=dev

# Create the dist directory if it doesn't exist
mkdir -p dist

# Clean the dist directory
rm -rf dist/*

# Export environment variables
export NODE_ENV=production
export VITE_ENABLE_DIAGNOSTICS=false

# Run TypeScript compiler
./node_modules/.bin/tsc

# Build the app
./node_modules/.bin/vite build

# Ensure index.html is properly set for SPA routing
cp dist/index.html dist/200.html
cp dist/index.html dist/404.html

echo "Build completed!" 