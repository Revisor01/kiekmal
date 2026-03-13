FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
RUN pnpm install --frozen-lockfile

# Build
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY packages/types/ packages/types/
COPY apps/api/ apps/api/
COPY tsconfig.json ./
RUN cd apps/api && pnpm exec tsc

# Production
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/packages/types ./packages/types
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY apps/api/drizzle ./apps/api/drizzle
COPY apps/api/package.json ./apps/api/package.json
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/index.js"]
