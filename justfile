default:
    @just --list

install:
    npm ci

dev:
    npm run dev

build:
    npm run build

# Build the image and serve it read-only on http://localhost:8080/docs/
docker-run key="":
    docker build --platform linux/amd64 -t emporium-docs:local .
    docker run --rm --read-only --tmpfs /tmp --cap-drop ALL --security-opt no-new-privileges \
        -e SLOPE_PROJECT_KEY={{key}} -p 8080:8080 emporium-docs:local

# Release emporium.build/docs (namespace docs): `just release --dry-run` first
release *args:
    ./scripts/release.sh {{args}}
