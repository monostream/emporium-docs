#!/bin/ash
set -e

# Defaults
: ${GIT_URL:=https://github.com/monostream/emporium-docs.git}
: ${BASE_PATH:=/docs}
: ${POLL_INTERVAL:=60}

# Configure nginx to serve files from base path
echo "server { listen 80; location $BASE_PATH { alias /usr/share/nginx/html; try_files \$uri \$uri/ =404; } }" > /etc/nginx/conf.d/default.conf

# Start nginx in the background
nginx -g 'daemon off;' &

git clone $GIT_URL .
npm install
npm run build
cp -r /workspace/.vitepress/dist/* /usr/share/nginx/html/

while true; do
  git fetch origin
  if [ $(git rev-list HEAD...origin/main --count) -ne 0 ]; then
    echo "New changes detected. Pulling updates and rebuilding docs..."
    git pull
    npm run build
    cp -r /workspace/.vitepress/dist/* /usr/share/nginx/html/
    echo "Update completed."
  else
    echo "No changes detected."
  fi
  sleep $POLL_INTERVAL
done
