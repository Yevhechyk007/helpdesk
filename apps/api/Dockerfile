FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.0
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN pnpm install --frozen-lockfile

# Build
FROM deps AS builder
COPY apps/api ./apps/api/
COPY packages/shared ./packages/shared/
RUN pnpm --filter @helpdesk/api build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app
RUN npm install -g pnpm@9.15.0

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "apps/api/dist/main"]
