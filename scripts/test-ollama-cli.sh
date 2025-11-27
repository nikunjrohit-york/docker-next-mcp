#!/usr/bin/env bash
set -euo pipefail

echo "Listing installed Ollama models (cli):"
ollama list || true

echo "\nRun a quick interactive prompt using the CLI (non-blocking output):"
ollama run llama3.2 "Hello! Please reply with a short message and the model name you're using." || true
