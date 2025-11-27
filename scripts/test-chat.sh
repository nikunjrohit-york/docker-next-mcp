#!/usr/bin/env bash
set -euo pipefail

if [ -z "${HOST:-}" ]; then
  HOST="http://localhost:${PORT:-3000}"
fi

echo "Posting a test message to ${HOST}/api/chat"
curl -s -X POST "${HOST}/api/chat" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello, please introduce yourself and mention which model served this message."}]}' \
  | sed -n '1,200p'

echo "\nDone. If the response includes a model name (e.g. 'llama3.2' or 'gpt-4o-mini'), the local provider is returning chat output." 

echo "\nPosting non-stream JSON response to ${HOST}/api/chat?stream=false"
curl -s -X POST "${HOST}/api/chat?stream=false" \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hi — return a JSON response that includes the model text only."}]}' \
  | jq -C '.' || true

echo "\nPosting JSON response with Accept: application/json to ${HOST}/api/chat"
curl -s -X POST "${HOST}/api/chat" \
  -H 'Accept: application/json' \
  -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"Hello — send JSON because Accept: application/json"}]}' \
  | jq -C '.' || true
