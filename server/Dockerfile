FROM node:24-bookworm-slim
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY prisma/schema.prisma /app/prisma/schema.prisma
COPY package.json /app/package.json
COPY shared/ /app/shared/
COPY server/ ./
EXPOSE 3001
CMD ["npm", "run", "dev"]
