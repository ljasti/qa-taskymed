# File: Dockerfile
# Purpose: Builds a pinned, non-root Playwright runner image for Docker/CI execution.
# Maintainer: Lakshmikiran J. | Project: TaskyMed QA
# Origin: Manually maintained; the base image is supplied by Microsoft Playwright.
# Build: docker compose build. Edit manually when the pinned Playwright image changes.
# It consumes package-lock.json and does not contain application credentials.
FROM mcr.microsoft.com/playwright:v1.61.1-noble
WORKDIR /work
COPY package.json package-lock.json* tsconfig.json playwright.config.ts ./
RUN npm ci --ignore-scripts
COPY . .
RUN useradd --create-home --shell /bin/bash qauser && chown -R qauser:qauser /work
USER qauser
ENTRYPOINT ["npm"]
