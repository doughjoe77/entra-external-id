# -----------------------------
# 1. Build Stage
# -----------------------------
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies first (better caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the source
COPY . .

# Build the production bundle
RUN npm run build


# -----------------------------
# 2. Run Stage (nginx)
# -----------------------------
FROM nginx:1.27-alpine

# Remove default nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built Vue SPA from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config (optional but recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
