#!/bin/bash

# Parse command line arguments for test filtering
# Usage: sh scripts/test-browser-wrapper.sh badge,button
# Or: bun run test:browser -- badge,button

export TEST_FILTER="$1"

bun run build:tests && rspack serve --config rspack.config.test.mjs
