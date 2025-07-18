FROM node:20-slim

WORKDIR /app

# Add environment variable to ignore Prisma checksum errors
ENV PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Set the command to run the bot
CMD ["npm", "start"]
