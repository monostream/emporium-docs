# https://github.com/vuejs/vitepress/releases
VERSION=1.0.0-rc.41
REGISTRY=emporium-apps.docker.pkg.emporium.rocks
TAG=${REGISTRY}/vitepress:${VERSION}

docker build . -t ${TAG} --platform linux/amd64
docker push ${TAG}
