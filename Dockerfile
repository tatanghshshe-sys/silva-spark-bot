FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy bot code
COPY . .

# Create sessions directory
RUN mkdir -p /app/sessions

EXPOSE 3000

# Start bot
CMD ["node", "index.js"]
