# Use the official Node.js image as the base image
FROM node:latest

# Set the working directory
WORKDIR /app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

# Run the application
CMD ["node", "./build/index.js"]