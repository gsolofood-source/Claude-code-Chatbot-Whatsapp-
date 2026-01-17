# Dockerfile for SF-IG-CHECK MCP HTTP Server
# With Chromium support for Puppeteer website scraping

# Use Debian-based Node image (required for Chromium)
FROM node:22-slim

# Install Chromium and dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-khmeros \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Set NODE_ENV
ENV NODE_ENV=production

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy application code
COPY src ./src
COPY config ./config

# Create non-root user for security
RUN groupadd -r nodeuser && useradd -r -g nodeuser nodeuser \
    && chown -R nodeuser:nodeuser /app \
    && mkdir -p /home/nodeuser/.cache/puppeteer \
    && chown -R nodeuser:nodeuser /home/nodeuser

# Switch to non-root user
USER nodeuser

# Expose port (Railway sets PORT env variable)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+process.env.PORT+'/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start MCP HTTP server
CMD ["node", "src/mcp/server-sse.js"]
