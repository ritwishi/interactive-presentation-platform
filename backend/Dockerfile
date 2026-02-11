FROM node:18-slim

# Install system dependencies for PDF/PPT conversion
RUN apt-get update && apt-get install -y \
    poppler-utils \
    ghostscript \
    libreoffice-core \
    libreoffice-writer \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Verify installations
RUN echo "=== Checking installed tools ===" && \
    which pdftoppm && pdftoppm -v 2>&1 || echo "pdftoppm not found" && \
    which gs && gs --version || echo "gs not found" && \
    which soffice && soffice --version || echo "soffice not found" && \
    which libreoffice && libreoffice --version || echo "libreoffice not found"

WORKDIR /app

# Copy package files and install ALL dependencies (including libreoffice-convert)
COPY package.json package-lock.json* ./
RUN npm install

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads converted-slides

EXPOSE 5000

CMD ["node", "server.js"]
