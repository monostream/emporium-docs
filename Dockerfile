FROM nginx:alpine

# Install git and node with npm
RUN apk add --no-cache git npm

WORKDIR /workspace

# Copy the script that will poll, build, and serve the docs
COPY poll-and-serve.sh /usr/local/bin/poll-and-serve.sh
RUN chmod +x /usr/local/bin/poll-and-serve.sh

EXPOSE 80

CMD ["/usr/local/bin/poll-and-serve.sh"]
