#!/bin/sh
set -e

echo "🚀 Starting InsightOne..."

# Set default database path if not provided
export DATABASE_URL="${DATABASE_URL:-file:/app/data/insightone.db}"

# Run database migrations
echo "📦 Running database migrations..."
cd /app
bunx prisma migrate deploy || bunx prisma db push

echo "✅ Database ready!"

# Execute the main command
exec "$@"
