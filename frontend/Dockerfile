# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Run
FROM node:18-alpine AS runner

WORKDIR /app

# Copy from the standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Expose port
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Run Next.js standalone server
CMD ["node", "server.js"]
