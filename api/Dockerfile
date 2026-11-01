FROM node:24-bookworm-slim
WORKDIR /app/api
COPY api/package.json api/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY prisma/schema.prisma /app/prisma/schema.prisma
COPY api/ ./
EXPOSE 3001
CMD ["npm", "run", "dev"]
