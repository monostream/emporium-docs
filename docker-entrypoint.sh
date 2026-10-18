#!/bin/sh
# Renders the Slope Analytics script tag into an nginx include under /tmp, so
# the root filesystem stays read-only. nginx's sub_filter adds the tag before
# </head> of every HTML page; the script posts to /_a/e, the landing page's
# same-origin proxy on emporium.build. An empty SLOPE_PROJECT_KEY turns it off.
set -eu

mkdir -p /tmp/nginx
key=${SLOPE_PROJECT_KEY:-}
if [ -n "$key" ]; then
    # The key lands unescaped in HTML and nginx syntax; `case` matches the whole
    # value, newlines included, so anything outside the charset is refused.
    case $key in
        *[!A-Za-z0-9_-]*) echo "SLOPE_PROJECT_KEY has characters outside [A-Za-z0-9_-]" >&2; exit 1 ;;
    esac
    tag="<script defer src=\"/docs/slope-analytics.js\" data-project-key=\"$key\" data-endpoint=\"/_a\"></script>"
    printf "sub_filter '</head>' '%s</head>';\nsub_filter_once on;\n" "$tag" > /tmp/nginx/slope.conf
    echo "Slope Analytics enabled"
else
    : > /tmp/nginx/slope.conf
    echo "Slope Analytics off (SLOPE_PROJECT_KEY is empty)"
fi

exec "$@"
