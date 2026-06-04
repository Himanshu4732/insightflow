FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs and package.json descriptors for caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install dependencies for all workspaces
RUN npm ci

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build monorepo modules
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/web

# Production Runner stage
FROM node:20-alpine

WORKDIR /app/apps/web

COPY --from=builder /app/package.json /app/package-lock.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/packages/shared /app/packages/shared
COPY --from=builder /app/apps/web /app/apps/web

EXPOSE 3000

CMD ["npx", "vite", "preview", "--port", "3000", "--host", "0.0.0.0"]
