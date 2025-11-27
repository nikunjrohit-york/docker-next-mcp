#!/bin/bash
set -e

# Configuration
IMAGE_NAME="insightone"
DOCKER_USERNAME="${DOCKER_USERNAME:-yourusername}"
VERSION="${VERSION:-latest}"

echo "🐳 Building InsightOne Docker Image..."

# Build the image
docker build -f Dockerfile.standalone -t ${IMAGE_NAME}:${VERSION} .

# Tag for Docker Hub
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}
docker tag ${IMAGE_NAME}:${VERSION} ${DOCKER_USERNAME}/${IMAGE_NAME}:latest

echo "✅ Build complete!"
echo ""
echo "To push to Docker Hub:"
echo "  docker login"
echo "  docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:${VERSION}"
echo "  docker push ${DOCKER_USERNAME}/${IMAGE_NAME}:latest"
echo ""
echo "To test locally:"
echo "  docker run -p 3000:3000 -v insightone-data:/app/data ${IMAGE_NAME}:${VERSION}"
