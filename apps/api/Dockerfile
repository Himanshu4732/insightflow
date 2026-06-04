FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configs and package.json descriptors for caching
COPY package.json package-lock.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install dependencies for all workspaces
RUN npm ci

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build monorepo modules
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=apps/api

# Production Runner stage
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 4000

CMD ["npm", "run", "start", "--workspace=apps/api"]
