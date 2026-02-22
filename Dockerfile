# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine
# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config for React Routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Add env.sh script
COPY env.sh /env.sh
RUN chmod +x /env.sh

EXPOSE 80

ENTRYPOINT ["/env.sh"]
CMD ["nginx", "-g", "daemon off;"]
