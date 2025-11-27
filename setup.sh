#!/bin/bash
echo "Setting up InsightOne..."

# Create .env if not exists
if [ ! -f .env ]; then
  echo "Creating .env..."
  echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/insightone"' > .env
  echo 'NEXTAUTH_SECRET="changeme"' >> .env
  echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env
  echo 'AI_PROVIDER="local"' >> .env
  echo 'OPENAI_BASE_URL="http://localhost:11434/v1"' >> .env
fi

echo "Starting Docker containers..."
docker-compose up -d --build

echo "Waiting for database to be ready..."
sleep 10

echo "Running migrations..."
# Using bunx to run prisma commands
bunx prisma migrate deploy

echo "InsightOne is ready at http://localhost:3000"
