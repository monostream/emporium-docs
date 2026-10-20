default:
    @just --list

install:
    npm ci

dev:
    npm run dev

build:
    npm run build

# Regenerate reference/emporium-yaml.md; `just sync-schema <path to v1.json>` first when the schema changed
gen:
    npm run gen:reference

# Copy pkg/chartspec/schema/v1.json of the emporium repository in and regenerate
sync-schema path:
    node scripts/gen-emporium-yaml.mjs --sync {{path}}

# Fail if reference/emporium-yaml.md is stale
check:
    npm run check:reference

# Build the image and serve it read-only on http://localhost:8080/docs/
docker-run key="":
    docker build --platform linux/amd64 -t emporium-docs:local .
    docker run --rm --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
        -e SLOPE_PROJECT_KEY={{key}} -p 8080:8080 emporium-docs:local

# Release emporium.build/docs (namespace docs): `just release --dry-run` first
release *args:
    ./scripts/release.sh {{args}}
