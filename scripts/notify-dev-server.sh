#!/bin/sh

# Notify the development server that frontend files have been rebuilt
# This triggers a browser reload via WebSocket

SERVER_URL="${DEV_SERVER_URL:-http://localhost:3000}"
ENDPOINT="${SERVER_URL}/api/dev/frontend-updated"

# Use curl to send notification, suppress output, ignore errors if server is not running
curl -X POST "$ENDPOINT" -s -o /dev/null -w "" 2>/dev/null || true