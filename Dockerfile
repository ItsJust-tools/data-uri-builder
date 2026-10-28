FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
COPY packages/core/package.json ./packages/core/package.json
RUN npm ci

FROM base AS builder
ENV NODE_ENV=production
ENV BUILD_STANDALONE=true
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000

# Fail the container health check if the standalone server stops answering.
# `wget --spider` comes from BusyBox in the alpine image, so no extra packages
# (and no root install step) are needed in the runtime layer.
# Probe 127.0.0.1 rather than `localhost`: the server binds HOSTNAME=0.0.0.0
# (IPv4 only), while BusyBox wget resolves `localhost` to ::1 first and does
# not fall back, which would make the container report unhealthy forever.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
