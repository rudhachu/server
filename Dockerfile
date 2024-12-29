# Use an official Node.js image
FROM node:16

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install necessary dependencies for canvas and uuid
RUN apt-get update && apt-get install -y \
    uuid-dev \
    libcairo2-dev \
    libpango1.0-dev \
    libgif-dev \
    libjpeg-dev \
    && rm -rf /var/lib/apt/lists/*

# Install npm dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on (if applicable)
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]