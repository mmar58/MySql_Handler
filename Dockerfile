FROM node:22-alpine AS builder

WORKDIR /app

# Enable corepack for pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace configuration and package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install dependencies (frozen lockfile for deterministic builds)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the application
# This runs the frontend build (which outputs to backend/src/public)
# and then the backend build (which compiles TS and copies public to dist)
ENV CI=true
RUN pnpm run build

# Stage 2: Production Image
FROM node:22-alpine

WORKDIR /app

# Only copy backend package.json for production dependencies
COPY backend/package.json ./
RUN npm install --omit=dev

# Copy the built artifacts from the builder stage
COPY --from=builder /app/backend/dist ./dist

# Create necessary directories that the app might expect
RUN mkdir -p data backups

# Expose backend port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]
