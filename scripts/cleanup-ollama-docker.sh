#!/usr/bin/env bash
# Cleanup script for Ollama artifacts and Docker images/volumes
# WARNING: This removes local model data and Docker images/volumes. Use with caution.

set -euo pipefail

# Stop compose and remove volumes
docker compose -f docker-compose.yml -f docker-compose.ollama.yml down --volumes --remove-orphans || true

# Remove container by name if exists
docker rm -f ollama || true

# Remove Ollama image if present
if docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | grep -q "ollama/ollama"; then
  docker image ls | grep "ollama/ollama"
  read -p "Delete ollama/ollama image? (y/N) " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    docker image rm -f ollama/ollama:latest || true
  fi
fi

# Prune unused images and volumes interactively
read -p "Run docker system prune -af (this deletes unused images, containers, networks, and volumes)? (y/N) " ans
if [[ "$ans" =~ ^[Yy]$ ]]; then
  docker system prune -af --volumes || true
fi

# Remove the local Ollama model folder
if [[ -d "./ollama-data" ]]; then
  read -p "Delete local ./ollama-data folder (this deletes downloaded models)? (y/N) " ans
  if [[ "$ans" =~ ^[Yy]$ ]]; then
    rm -rf ./ollama-data
  fi
fi

echo "Cleanup complete."