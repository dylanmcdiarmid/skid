#!/bin/sh

set -e

ENV=${1:-dev}
WATCH=${2:-}

export BROWSERSLIST_IGNORE_OLD_DATA=true

INPUT="./client/src/index.css"
OUTPUT="./public/css/${ENV}/bundle.css"

mkdir -p "./public/css/${ENV}"

if [ "$ENV" = "prod" ]; then
  echo "📦 Building CSS for production..."
  bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT" --minify
else
  echo "📦 Building CSS for development..."
  if [ "$WATCH" = "--watch" ]; then
    echo "👀 Watching for CSS changes..."
    bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT" --watch
  else
    bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT"
  fi
fi

