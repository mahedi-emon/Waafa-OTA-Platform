#!/bin/sh
# Compatibility for server bundles copied before issue 231, whose compose.yml starts the worker with
# `node_modules/.bin/tsx src/worker.ts`. The image no longer holds TypeScript or tsx, so this stand-in runs the
# compiled file instead. Remove it one release after the owner copies the new deploy/server bundle (expand, contract).
case "$1" in
  src/worker.ts) exec node dist/worker.js ;;
  src/main.ts) exec node dist/main.js ;;
  prisma/seed.ts) exec node dist/seed.js ;;
esac
echo "This image runs compiled JavaScript: use node dist/main.js, dist/worker.js or dist/seed.js" >&2
exit 1
