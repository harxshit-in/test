#!/bin/bash

echo "========================================="
echo "  TestBook Platform - Quick Start"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "Please install Node.js from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the testbook-platform directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
    echo ""
    echo "========================================="
    echo "  🎉 Setup Complete!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Configure Firebase (see SETUP_GUIDE.md)"
    echo "2. Run 'npm start' to start the development server"
    echo ""
    echo "Starting the app now..."
    echo ""
    npm start
else
    echo ""
    echo "❌ Installation failed!"
    echo "Please check the error messages above"
    exit 1
fi
