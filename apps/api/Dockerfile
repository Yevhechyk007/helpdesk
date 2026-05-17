FROM node:20-alpine AS builder
WORKDIR /app

COPY apps/api/package.json ./
RUN npm install

COPY apps/api/src ./src
COPY apps/api/tsconfig.json ./
COPY apps/api/tsconfig.build.json ./
COPY apps/api/nest-cli.json ./

RUN npx nest build

# Production image
FROM node:20-alpine
WORKDIR /app

COPY apps/api/package.json ./
RUN npm install --omit=dev

COPY --from=builder /app/dist ./dist

EXPOSE 3001
ENV NODE_ENV=production

CMD ["node", "dist/main"]
