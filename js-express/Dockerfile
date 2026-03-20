# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules /app/node_modules
COPY package*.json ./
COPY index.js ./

EXPOSE 8082

CMD ["node", "index.js"]