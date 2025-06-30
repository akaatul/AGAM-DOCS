# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy all files
COPY . .

# Build the app with standalone output
RUN npm run build

# Change directory to the standalone output folder
WORKDIR /app/.next/standalone

# Copy static files
COPY --from=0 /app/public ./public
COPY --from=0 /app/.next/static ./.next/static

# Expose port
EXPOSE 3000

# Set env vars
ENV PORT=3000
ENV NODE_ENV=production

# Run Next.js production server
CMD ["node", "server.js"]
