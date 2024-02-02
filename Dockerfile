FROM node:latest

# Install git and nginx
RUN apt-get update && apt-get install -y git nginx

WORKDIR /app

# Clone the repository
RUN git clone https://github.com/monostream/emporium-docs .

# Copy the script that will poll, build, and serve the docs
COPY poll-and-serve.sh /usr/local/bin/poll-and-serve.sh
RUN chmod +x /usr/local/bin/poll-and-serve.sh

# Initial build
RUN npm install && npm run build

# Configure nginx to serve the built docs
RUN mkdir -p /usr/share/nginx/html/docs
COPY /app/.vitepress/dist /usr/share/nginx/html/docs
RUN echo 'server { listen 80; location /docs { alias /usr/share/nginx/html/docs; try_files $uri $uri/ =404; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["/usr/local/bin/poll-and-serve.sh"]
