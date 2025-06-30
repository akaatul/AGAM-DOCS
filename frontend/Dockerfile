FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Set environment variable for the port
ENV PORT=3000
ENV NODE_ENV=production

# Start the application in production mode
CMD ["npm", "start"] 