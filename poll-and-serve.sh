#!/bin/ash
set -e

# Start nginx in the background
nginx -g 'daemon off;' &

while true; do
  git fetch origin
  if [ $(git rev-list HEAD...origin/main --count) -ne 0 ]; then
    echo "New changes detected. Pulling updates and rebuilding docs..."
    git pull
    npm run build
    cp -r /app/.vitepress/dist/* /usr/share/nginx/html/
    echo "Update completed."
  else
    echo "No changes detected."
  fi
  sleep 60 # Check every minute
done
