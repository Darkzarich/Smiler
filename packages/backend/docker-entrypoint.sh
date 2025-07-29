#!/bin/bash
set -e

if [ "$(id -u)" = '0' ]; then
  echo "Fixing permissions for node user..."
  chown -R node:node /prod/backend || true
  exec su node -c "$*"
else
  exec "$@"
fi
