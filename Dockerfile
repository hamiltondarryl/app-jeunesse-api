# syntax=docker/dockerfile:1.7
# Images Linux (amd64 / arm64). Sur macOS/Windows : docker buildx --platform linux/amd64

FROM --platform=$BUILDPLATFORM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache libc6-compat openssl python3 make g++

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install --legacy-peer-deps --ignore-scripts=false

COPY nest-cli.json tsconfig.json tsconfig.build.json ./
COPY src ./src
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache dumb-init openssl libc6-compat python3 make g++ \
  && rm -rf /var/cache/apk/*

ENV NODE_ENV=production \
    PORT=4000 \
    APP_STATUS=PROD \
    UPLOADS_DIR=/app/uploads \
    RUN_MIGRATIONS=true

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./
RUN npm install --omit=dev --legacy-peer-deps --ignore-scripts=false \
  && npm install prisma@7.5.0 --omit=dev --no-audit --no-fund \
  && npx prisma generate \
  && npm cache clean --force \
  && apk del python3 make g++

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/generated ./src/generated
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh \
  && mkdir -p /app/uploads/organisations/public \
  && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker/entrypoint.sh"]
