# https://github.com/vuejs/vitepress/releases
VERSION=1.1.0
REGISTRY=emporium-apps.docker.pkg.emporium.rocks
TAG=${REGISTRY}/vitepress:${VERSION}

docker build . -t ${TAG} --platform linux/amd64
docker push ${TAG}
