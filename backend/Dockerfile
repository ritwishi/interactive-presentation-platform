FROM node:18-slim

# Install system dependencies for PDF/PPT conversion
RUN apt-get update && apt-get install -y \
    poppler-utils \
    ghostscript \
    libreoffice-core \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install Node.js dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads converted-slides

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
