#!/bin/bash
set -e

echo "Starting Deployment Script..."

# Build Backend
echo "Deploying Backend..."
cd backend
pip install -r requirements.txt
alembic upgrade head
echo "Backend ready."

# Deploy Frontend (If deploying both on VPS)
# cd ../frontend
# npm install
# npm run build
# echo "Frontend ready."

echo "Deployment completed successfully!"
