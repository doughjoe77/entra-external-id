# -----------------------------
# 1. Build Stage
# -----------------------------
FROM node:latest AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY . .

# -----------------------------
# 2. Runtime Stage (Alpine)
# -----------------------------
FROM node:latest

WORKDIR /app

# Copy built app from previous stage
COPY --from=build /app /app

# Expose API port
EXPOSE 4000

# Run as non-root user (node user exists in alpine images)
USER node

# Start the API
CMD ["node", "src/server.js"]
