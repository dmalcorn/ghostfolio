FROM mcr.microsoft.com/devcontainers/typescript-node:24

# Update npm to latest
RUN npm install -g npm@11.10.1

# Install OpenSSL for Prisma and other useful tools
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*
