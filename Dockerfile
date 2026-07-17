FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy bot code
COPY . .

# Create sessions directory
RUN mkdir -p /app/sessions

EXPOSE 3000

# Start bot
CMD ["node", "index.js"]
