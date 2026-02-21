# --- Build Stage ---
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Pass build-time variables nice
ARG VITE_API_BASE
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_CASHFREE_ENV
ENV VITE_API_BASE=$VITE_API_BASE
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_CASHFREE_ENV=$VITE_CASHFREE_ENV

RUN npm run build

# --- Production Stage ---
FROM nginx:stable-alpine
# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add custom Nginx config for React Routing (important!)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
