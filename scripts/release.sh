#!/usr/bin/env bash
# Release emporium.build/docs: tag the next version, build and push the image, roll it out.
#
# Versions are git tags vX.Y.Z on the commit that was deployed. Each run takes
# the latest tag and bumps the patch (or --minor / --major); the first release
# is v0.1.0. The tag is pushed BEFORE the build, so two people can never
# release the same number.
set -euo pipefail

IMAGE=shitlab.docker.pkg.emporium.rocks/emporium-docs
NAMESPACE=docs
RELEASE=emporium-docs
DEPLOYMENT=emporium-docs
FIRST_VERSION=0.1.0
URL=https://emporium.build/docs/

usage() {
  cat <<EOF
Usage: release.sh [--dry-run] [--minor|--major] [--context NAME] [--allow-branch]

  --dry-run       run the read-only checks, print the version and every command, change nothing
  --minor/--major bump minor or major instead of patch
  --context NAME  kube context to deploy with (default: \$KUBE_CONTEXT, else the current context)
  --allow-branch  emergency only: release a HEAD that is not origin/main
EOF
}

die() { echo "error: $*" >&2; exit 1; }

# Print a command, then run it unless this is a dry run.
run() {
  printf '+'; printf ' %q' "$@"; echo
  if [[ $DRY_RUN == 0 ]]; then "$@"; fi
}

# Latest vX.Y.Z tag (without the v), or nothing when there is none.
latest_version() {
  git tag --list 'v*' --sort=-v:refname |
    awk '/^v[0-9]+\.[0-9]+\.[0-9]+$/ && !found { found = 1; print substr($0, 2) }'
}

# next_version 1.2.3 patch|minor|major; no version yet starts at FIRST_VERSION.
next_version() {
  if [[ -z $1 ]]; then echo "$FIRST_VERSION"; return; fi
  local major minor patch
  IFS=. read -r major minor patch <<<"$1"
  case $2 in
    major) echo "$((major + 1)).0.0" ;;
    minor) echo "$major.$((minor + 1)).0" ;;
    patch) echo "$major.$minor.$((patch + 1))" ;;
  esac
}

main() {
  DRY_RUN=0 ALLOW_BRANCH=0 BUMP=patch CONTEXT=${KUBE_CONTEXT:-}
  while (($#)); do
    case $1 in
      --dry-run) DRY_RUN=1 ;;
      --allow-branch) ALLOW_BRANCH=1 ;;
      --minor | --major) BUMP=${1#--} ;;
      --context) [[ $# -ge 2 ]] || die "--context needs a value"; CONTEXT=$2; shift ;;
      --context=*) CONTEXT=${1#*=} ;;
      -h | --help) usage; exit 0 ;;
      *) usage >&2; die "unknown argument: $1" ;;
    esac
    shift
  done

  cd "$(git -C "$(dirname "$0")" rev-parse --show-toplevel)"

  # --- preconditions (read-only) ---------------------------------------------
  # The whole repo is the build context, so it must match a commit.
  [[ -z $(git status --porcelain --untracked-files=all) ]] ||
    die "the work tree has uncommitted or untracked changes; the image must match a commit"

  git fetch --quiet --tags origin main
  local sha
  sha=$(git rev-parse HEAD)
  if [[ $sha != "$(git rev-parse origin/main)" ]]; then
    [[ $ALLOW_BRANCH == 1 ]] ||
      die "HEAD ($(git rev-parse --short HEAD)) is not origin/main; pull/merge first (or --allow-branch in an emergency)"
    echo "warning: releasing $(git rev-parse --short HEAD), which is not origin/main (--allow-branch)" >&2
  fi

  CONTEXT=${CONTEXT:-$(kubectl config current-context)} || die "no kube context; pass --context or set KUBE_CONTEXT"
  echo "kube context: $CONTEXT"
  # helm upgrade --install creates the release on the first run, but not the
  # namespace: that holds the registry pull secret and is set up beforehand.
  kubectl --context "$CONTEXT" get namespace "$NAMESPACE" >/dev/null ||
    die "namespace $NAMESPACE not found on context $CONTEXT"

  local version tag
  version=$(next_version "$(latest_version)" "$BUMP")
  tag=v$version
  echo "releasing $IMAGE:$version from commit $sha"
  [[ $DRY_RUN == 0 ]] || echo "(dry run: nothing below is executed)"

  # --- reserve the version: the push fails if someone else took it ----------
  # Host and pid make the tag object unique, so a parallel run's push is rejected
  # even with the same commit, identity and second.
  run git tag -a "$tag" -m "emporium-docs $version" -m "released from $(hostname) pid $$" "$sha"
  if ! run git push --quiet origin "refs/tags/$tag"; then
    git tag -d "$tag" >/dev/null
    die "could not push $tag (taken by a parallel release?); re-run to take the next number"
  fi
  if [[ $DRY_RUN == 0 ]]; then
    # A global, because main's locals are gone when the EXIT trap runs.
    BURNED="error: release $tag failed after the tag was pushed. $tag is burned; the next run takes the next number. The cluster may still run the previous version: helm history $RELEASE -n $NAMESPACE --kube-context $CONTEXT"
    trap 'echo "$BURNED" >&2' EXIT
  fi

  # --- build, push, deploy ----------------------------------------------------
  run docker build --platform linux/amd64 \
    --label "org.opencontainers.image.version=$version" \
    --label "org.opencontainers.image.revision=$sha" \
    --label "org.opencontainers.image.source=https://github.com/monostream/emporium-docs" \
    --tag "$IMAGE:$version" .
  # In Vibe-Coder workspaces `docker` is a symlink to `vc`, whose build already pushes.
  if [[ $(basename "$(readlink -f "$(command -v docker)")") != vc ]]; then
    run docker push "$IMAGE:$version"
  fi
  run helm upgrade --install "$RELEASE" chart/emporium-docs \
    --kube-context "$CONTEXT" -n "$NAMESPACE" \
    -f chart/values-emporium.yaml \
    --set "image.tag=$version" --wait --timeout 5m
  run kubectl --context "$CONTEXT" -n "$NAMESPACE" rollout status "deployment/$DEPLOYMENT" --timeout 2m

  trap - EXIT
  if [[ $DRY_RUN == 1 ]]; then echo "dry run: would release $version (commit $sha) to $URL"; return; fi
  echo "released $version (commit $sha) to $URL"
}

# Sourcing the file (for tests) only defines the functions.
if [[ ${BASH_SOURCE[0]} == "$0" ]]; then main "$@"; fi
