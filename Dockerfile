FROM node:20


# Set working directory
WORKDIR /app

# Copy package.json & install deps
COPY package*.json ./

RUN npm install

# Copy app
COPY . .

# Expose port
EXPOSE 3000

# Start app
CMD ["npm", "start"]
