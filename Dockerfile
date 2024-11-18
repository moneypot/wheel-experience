FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# This only runs in production mode
FROM base AS production-build
COPY .env.production .env.local
RUN npm run build

# Production: Create minimal container that just contains the static site + nginx
FROM nginx:alpine AS production
WORKDIR /app
COPY --from=production-build /app/dist .
# COPY ./nginx.conf /etc/nginx/conf.d/default.conf
RUN echo 'server { listen 4004; root /app; location / { try_files $uri $uri/ /index.html =404; } }' > /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]

# Development: Run vite dev server
FROM base AS development
CMD [ "npx", "vite", "--port", "4004", "--host", "--mode", "development" ]

