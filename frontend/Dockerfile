# Minimal Production Nginx Alpine Web Server for Eventease React SPA
FROM nginx:1.27-alpine

# Copy pre-compiled static bundle
COPY dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
