FROM node:24-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --no-audit --no-fund
RUN sha256sum package-lock.json | cut -d ' ' -f 1 > node_modules/.blueform-lock-hash

COPY . /app

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma generate && npm run dev -- --host 0.0.0.0 --port 3000"]
