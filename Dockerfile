# Bayanat (invoice-app) — production image
# Node 22 + Next.js 16 + Prisma 7 (SQLite) + Playwright Chromium (PDF rendering)
# Stage 1: install deps, chromium, build
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Chromium runtime deps + build tools (better-sqlite3 native compile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-6 libxcb1 libxext6 \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

# Chromium for PDF rendering (headless)
RUN npx playwright install chromium

COPY . .

RUN npx prisma generate
RUN npm run build

# Stage 2: runtime — same base, no build tools
FROM node:22-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Chromium runtime deps (no compiler toolchain)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 libatspi2.0-0 libx11-6 libxcb1 libxext6 \
    && rm -rf /var/lib/apt/lists/*

# Copy the whole app (node_modules includes compiled better-sqlite3 + prisma engines)
COPY --from=builder /app ./
# Playwright browsers live outside /app
COPY --from=builder /root/.cache/ms-playwright /root/.cache/ms-playwright

EXPOSE 3000

# Apply migrations on boot, then serve
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
