#!/bin/bash

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

# Success message
echo "All dependencies installed successfully! 🎉"
echo "Run 'npm start' to start the frontend and 'cd backend && npm run dev' to start the backend server."
