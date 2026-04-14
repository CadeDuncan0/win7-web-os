# --- Base Stage ---
# Use the official Node.js LTS image on Alpine Linux.
# Alpine is a minimal Linux distribution (~5MB vs ~900MB for full Debian).
# This keeps the final image lean while providing everything Next.js needs.
FROM node:20-alpine

# Set the working directory inside the container.
# All subsequent commands execute relative to this path.
# /app is the conventional location for application code in containers.
WORKDIR /app

# Copy package manifests first — before copying source code.
# Docker builds images in layers. Each instruction is a layer.
# Layers are cached: if package.json hasn't changed, Docker reuses
# the cached npm install layer and skips reinstalling dependencies.
# This makes rebuilds after source-only changes dramatically faster.
COPY package.json package-lock.json ./

# Install dependencies using the lockfile for deterministic installs.
# npm ci is preferred over npm install in containerized environments:
# - Installs exact versions from package-lock.json (no resolution)
# - Fails if package-lock.json is out of sync with package.json
# - Does not update package-lock.json
RUN npm ci

# Copy the rest of the source code into the container.
# This happens after npm ci so the dependency cache layer is preserved
# even when source files change.
COPY . .

# Expose port 3000 to the Docker network.
# This is documentation — it does not publish the port to the host.
# The actual port mapping is configured in docker-compose.yml.
EXPOSE 3000

CMD ["npm", "run", "dev:docker"]