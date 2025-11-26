#!/bin/sh

set -e

ENV=${1:-dev}
WATCH=${2:-}

export BROWSERSLIST_IGNORE_OLD_DATA=true

INPUT="./client/src/index.css"
OUTPUT="./public/css/${ENV}/bundle.css"
NOTIFY_SCRIPT="./scripts/notify-dev-server.sh"
SOURCE_DIRS="./client/src"

mkdir -p "./public/css/${ENV}"

if [ "$ENV" = "prod" ]; then
  echo "📦 Building CSS for production..."
  bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT" --minify
  echo "✅ CSS build complete"
else
  echo "📦 Building CSS for development..."
  if [ "$WATCH" = "--watch" ]; then
    echo "👀 Watching for CSS changes..."
    
    # Initial build
    bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT"
    sh "$NOTIFY_SCRIPT" 2>/dev/null || true
    
    # Watch for changes using inotifywait if available, otherwise use simple file polling
    if command -v inotifywait >/dev/null 2>&1; then
      # Use inotifywait to watch source files for changes
      echo "Using inotifywait to watch source files..."
      
      while true; do
        # Wait for any tsx, jsx, ts, js, or css file to change in source dirs
        inotifywait -r -e close_write,moved_to,create \
          --include '\.(tsx?|jsx?|css)$' \
          "$SOURCE_DIRS" 2>/dev/null
        
        echo "🔄 Source file changed, rebuilding CSS..."
        bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT"
        sh "$NOTIFY_SCRIPT" 2>/dev/null || true
        echo "✅ CSS rebuild complete and server notified"
        
        # Small delay to avoid rapid rebuilds
        sleep 0.5
      done
    else
      # Fallback: Poll source file timestamps (slower, no inotifywait)
      echo "⚠️  inotifywait not found, falling back to polling (slower)"
      
      LAST_SOURCE_CHECK=0
      while true; do
        sleep 2
        
        # Get the most recent modification time from source files
        CURRENT_CHECK=$(find "$SOURCE_DIRS" \( -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" -o -name "*.css" \) -type f 2>/dev/null | xargs stat -c %Y 2>/dev/null | sort -n | tail -1)
        
        if [ "$CURRENT_CHECK" != "$LAST_SOURCE_CHECK" ] && [ "$LAST_SOURCE_CHECK" != "0" ]; then
          echo "🔄 Source files changed, rebuilding CSS..."
          bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT"
          sh "$NOTIFY_SCRIPT" 2>/dev/null || true
          echo "✅ CSS rebuild complete and server notified"
        fi
        
        LAST_SOURCE_CHECK=$CURRENT_CHECK
      done
    fi
  else
    bunx @tailwindcss/cli -i "$INPUT" -o "$OUTPUT"
    sh "$NOTIFY_SCRIPT" 2>/dev/null || true
    echo "✅ CSS build complete"
  fi
fi

