# Stage 1: Build React TypeScript application with Node 20 Alpine
FROM node:20-alpine AS build

WORKDIR /app

# Cache package dependencies layer
COPY package*.json ./
RUN npm install

# Build static bundle
COPY . .
RUN npm run build

# Stage 2: Minimal Production Nginx Alpine Web Server
FROM nginx:1.27-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
