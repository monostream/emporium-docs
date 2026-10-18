# syntax=docker/dockerfile:1

# Build the static site
FROM node:24.21.0-alpine3.24 AS build
WORKDIR /src
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Serve it read-only as UID 101 on :8080
FROM nginxinc/nginx-unprivileged:1.30.6-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --chmod=0755 docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /src/.vitepress/dist /usr/share/nginx/html/docs
USER 101:101
EXPOSE 8080
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
