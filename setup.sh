#!/bin/bash

# Career Navigator - Quick Setup Script
# Run this to set up the entire application

set -e  # Exit on error

echo "🚀 Career Navigator - Quick Setup"
echo "=================================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Installing..."
    npm install -g wrangler
fi

echo "✅ Prerequisites OK"
echo ""

# Backend setup
echo "🔧 Setting up backend..."
cd backend

echo "Installing dependencies..."
npm install

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "1. Run: wrangler d1 create career-navigator-db"
echo "2. Copy the database_id from the output"
echo "3. Paste it into backend/wrangler.toml under [[d1_databases]]"
echo "4. Press Enter to continue..."
read

echo "Initializing database schema..."
wrangler d1 execute career-navigator-db --file=../schema.sql

echo ""
echo "⚠️  MANUAL STEP REQUIRED:"
echo "Set your Anthropic API key..."
wrangler secret put ANTHROPIC_API_KEY

cd ..

echo "✅ Backend setup complete!"
echo ""

# Frontend setup
echo "🎨 Setting up frontend..."
cd frontend

echo "Installing dependencies..."
npm install

echo "Creating .env file..."
cat > .env << EOF
VITE_API_URL=http://localhost:8787/api
EOF

cd ..

echo "✅ Frontend setup complete!"
echo ""

# Done
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Start backend:  cd backend && npm run dev"
echo "2. Start frontend: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
echo ""
echo "See README.md for more information."
