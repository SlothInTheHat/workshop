# =============================================================================
# Stage 1: Build
# =============================================================================
FROM cgr.dev/chainguard/wolfi-base:latest AS builder

ARG GITHUB_TOKEN
ARG NPM_TOKEN

RUN apk add --no-cache nodejs-22 npm git

# Git config for private repos
RUN if [ -n "$GITHUB_TOKEN" ]; then \
        git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "ssh://git@github.com/" && \
        git config --global url."https://x-access-token:${GITHUB_TOKEN}@github.com/".insteadOf "https://github.com/"; \
    fi

WORKDIR /app

# Install dependencies (including devDependencies for build)
COPY package*.json .npmrc ./
RUN npm ci

# Copy source and build
COPY . .
RUN npx svelte-kit sync && npm run build

# =============================================================================
# Stage 2: Runtime
# =============================================================================
FROM cgr.dev/chainguard/wolfi-base:latest

# CI/CD build args
ARG COMMIT_SHA
ARG BUILD_DATE
ARG APP_VERSION

ENV COMMIT_SHA=${COMMIT_SHA} \
    BUILD_DATE=${BUILD_DATE} \
    APP_VERSION=${APP_VERSION}

# Node.js environment
ENV NODE_ENV=production \
    PORT=3000

RUN apk add --no-cache nodejs-22

# Non-root user
USER nonroot
WORKDIR /app

# Copy built application only (adapter-node bundles all dependencies)
COPY --from=builder --chown=nonroot:nonroot /app/build ./build

EXPOSE 3000

# SvelteKit Node adapter entry point
CMD ["node", "build"]
