#!/bin/sh
# Exit immediately if a command exits with a non-zero status
set -e

echo "=== Running Medusa Database Migrations ==="
npx medusa db:migrate

echo "=== Starting Medusa Backend Server ==="
exec npx medusa start
