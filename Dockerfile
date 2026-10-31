# syntax=docker/dockerfile:1
FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM dependencies AS builder
COPY next.config.ts tsconfig.json postcss.config.mjs ./
COPY src ./src
COPY public ./public
ARG GIT_SHA
RUN node -e "if (!/^[a-f0-9]{40}$/.test(process.argv[1])) process.exit(1)" "$GIT_SHA"
RUN npm run build

FROM node:24.21.0-bookworm-slim@sha256:0e0ff40c39bc087845bfb27465a0df4ea419520094bc35842ff83dd8cbe6f9b6 AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
ARG GIT_SHA
ENV RELEASE_COMMIT=$GIT_SHA
LABEL org.opencontainers.image.source="https://github.com/QuangVMZu/HomeMind_LandingPage" \
      org.opencontainers.image.revision=$GIT_SHA
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# markdowns contains documentation only; it is not read by the audited app.
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=6s --start-period=30s --retries=4 \
  CMD node -e "fetch('http://127.0.0.1:3000/',{signal:AbortSignal.timeout(4000)}).then(async r=>{if(!r.ok||!(await r.text()).includes('HomeMind'))process.exit(1)}).catch(()=>process.exit(1))"
CMD ["node", "server.js"]
