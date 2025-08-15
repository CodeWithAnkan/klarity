# Use a Node.js 20 base image
FROM node:20-slim

# Install Python, pip, and FFmpeg which are required for yt-dlp
RUN apt-get update && apt-get install -y python3 python3-pip ffmpeg

# Install yt-dlp using pip, breaking the system package lock which is safe in a container
RUN pip3 install yt-dlp --break-system-packages

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Expose the port your app runs on
EXPOSE 5000

# The command to start the server
CMD [ "npm", "start" ]
