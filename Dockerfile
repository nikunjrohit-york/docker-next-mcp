FROM oven/bun:1 AS base

WORKDIR /app

COPY package.json bun.lock ./

RUN bun install

# Ensure OpenSSL is installed for Prisma's native engine
RUN apt-get update -y && apt-get install -y openssl libssl-dev postgresql-client && rm -rf /var/lib/apt/lists/* || true

# Generate Prisma client at build time to ensure it exists inside the image
COPY prisma ./prisma
RUN bunx prisma generate || true

COPY . .

CMD ["bun", "run", "dev"]
