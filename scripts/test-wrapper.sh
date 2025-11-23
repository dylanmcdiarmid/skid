#!/bin/bash

# Parse command line arguments for test filtering
# Usage: sh scripts/test-wrapper.sh badge,button
# Or: bun run test -- badge,button

export TEST_FILTER="$1"

bun run build:tests && node client/tests/test-runner.cjs
