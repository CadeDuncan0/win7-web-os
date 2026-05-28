<!-- task 15 - Docker Local Development Environment began: 2026-04-14 -->

# 🎯 Task 15: Docker Local Development Environment

---

## 🧠 Engineering Context & Rationale

### Why Docker Exists in This Stack

Docker solves a class of bugs that are infamously difficult to diagnose: **"it works on my machine."**
Without containerization, your application's runtime behavior depends on the specific version of
Node.js installed on your host, the OS-level libraries available, environment variable state, and
dozens of other variables that differ between machines. A collaborator cloning your repo — or you
cloning it on a new machine — may see completely different behavior despite identical source code.

Docker eliminates this by packaging your application together with its **entire runtime
environment** into a portable, reproducible unit called a **container**. A container built from
your `Dockerfile` runs identically on your Windows laptop, a Linux CI server, and a macOS
machine. The runtime is no longer a variable.

### The Distinction Between a Container and an Image

This is the mental model most developers get wrong initially and it causes real confusion:

```
Dockerfile     → the recipe (instructions for building)
Image          → the built artifact (read-only snapshot of filesystem + runtime)
Container      → a running instance of an image (writable, ephemeral)
```

You build an **image** once from a `Dockerfile`. You run **containers** from that image — you
can run many containers from the same image simultaneously. When you stop a container, it
disappears. The image persists. This is why Docker containers are called ephemeral: any data
written inside a container that is not mounted to a host volume is lost when the container stops.

### Why This Project Uses Docker as an Artifact, Not a Dev Environment

As established in Phase 0 planning: Cursor's IDE extensions (ESLint, TypeScript language server,
Prettier) require Node.js installed on the host machine. Running development exclusively inside
Docker would sever that connection and break all IDE tooling. Docker here serves two purposes:

1. **Reproducible local runtime** — confirms the app boots cleanly in a containerized environment
2. **CI parity** — GitHub Actions runs your build inside a Linux container; Docker confirms
   locally that your app behaves identically in that context

### Docker Compose vs Dockerfile — Why Both

`Dockerfile` defines how to build a single image. `docker-compose.yml` defines how to run one or
more containers together with their configuration: ports, volumes, environment variables, and
inter-service networking. Even with a single service (the Next.js app), Compose is the correct
tool because it manages the runtime configuration in a declarative, version-controlled file rather
than as a long `docker run` command you have to memorize or script separately.

---

## 🛠️ Step-by-Step Implementation

### Step 1 — Verify Docker Desktop Is Running

Open Docker Desktop. The Docker whale icon must be visible and stable in your system tray — not
animating, which would indicate Docker is still starting. Confirm from the terminal:

```bash
docker --version
docker compose version
```

Both commands must return version numbers with no errors before proceeding. If `docker compose`
fails but `docker-compose` (with a hyphen) works, you have an older Docker installation — update
Docker Desktop to the current stable release to get Compose V2.

### Step 2 — Create `.dockerignore`

Before writing the `Dockerfile`, create `.dockerignore` in the project root. This file tells
Docker which files and directories to exclude when it copies your project into the image. Without
it, Docker would copy `node_modules` (hundreds of megabytes), `.next` (build artifacts), and
`.env.local` (credentials) into the image — making it enormous and potentially leaking secrets.

```bash
touch .dockerignore
```

### Step 3 — Create the `Dockerfile`

Create `Dockerfile` in the project root:

```bash
touch Dockerfile
```

### Step 4 — Create `docker-compose.yml`

Create `docker-compose.yml` in the project root:

```bash
touch docker-compose.yml
```

### Step 5 — Build and Boot

Once both files are complete with the configuration from the next section:

```bash
docker compose up --build
```

`--build` forces Docker to rebuild the image from scratch rather than using a cached version.
Use this flag whenever you change the `Dockerfile` or `package.json`. For subsequent boots where
nothing has changed, `docker compose up` alone is sufficient and significantly faster.

Open `http://localhost:3000` — you should see the Next.js app running from inside the container.

### Step 6 — Verify Hot Reload

With the container running, make a visible change to `src/app/page.tsx` — add a word to the
heading or change any text. Save the file. The browser should reflect the change within 1–2
seconds without restarting the container. If it does not update, the volume mount in
`docker-compose.yml` is not configured correctly.

### Step 7 — Confirm Environment Variables Are Accessible

Add a temporary line to `src/app/page.tsx` to surface the GraphQL URL and confirm environment
variable passthrough from the host into the container is working:

```tsx
console.warn('[debug] GRAPHQL_URL from container:', process.env.NEXT_PUBLIC_GRAPHQL_URL)
```

Check the terminal where `docker compose up` is running — the value should appear in the Next.js
server output. Remove this line after confirming.

### Step 8 — Stop the Container

```bash
docker compose down
```

`down` stops and removes the containers. Your image persists — `docker compose up` next time
will start instantly without `--build` since nothing has changed.

---

## 📝 Code & Configuration

### `.dockerignore`

```
node_modules
.next
.env.local
.git
.gitignore
*.md
.husky
```

**Why each entry:**

`node_modules` — Never copy this into an image. The `Dockerfile` runs `npm ci` inside the
container to install dependencies fresh from `package-lock.json`. Copying host `node_modules`
would override that with potentially incompatible binaries (some npm packages compile
platform-specific native binaries — Windows binaries will not run inside a Linux container).

`.next` — Build artifacts from your host machine. The container runs `next dev` which generates
its own build cache internally.

`.env.local` — Credentials must never be baked into a Docker image. Images can be shared,
pushed to registries, and inspected. Environment variables are injected at runtime via
`docker-compose.yml`, not at build time.

`.git` — Git history is irrelevant to the running application and adds size.

`.husky` — Git hooks are a developer tooling concern, not a runtime concern.

---

### `Dockerfile`

```dockerfile
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

# TODO: [RESEARCH REQUIRED] The CMD below starts Next.js in development mode.
# Research the difference between `next dev` and `next start` and explain
# in a comment below why `next dev` is correct for this Dockerfile's purpose
# but would be wrong for a production deployment image.

# [Answer]: using npm run dev references the scripts in package.json where 'dev' = next dev and'start' = next start. These command line scripts build and deploy the project where dev builds it for a local development environment and enables Hot-Reload and debugging tools. start builds a production ready environment which lowers overhead and additional tools to keep it more lightweight and secrity-tight. In our current case we are still developing on a host machine and are not ready to deploy for users to access. This means we want to use dev for the local environment. Most importantly, because the project isn't being build before attempting to run npm run start, it will cause the command to fail.
CMD ["npm", "run", "dev"]
```

---

### `docker-compose.yml`

```yaml
# Compose file version — V2 syntax (current standard)
version: '3.8'

services:
  app:
    # Build the image from the Dockerfile in the current directory.
    build:
      context: .
      dockerfile: Dockerfile

    # Map port 3000 on the host to port 3000 in the container.
    # Format: "host_port:container_port"
    # After this mapping, http://localhost:3000 on your machine
    # reaches the Next.js server running inside the container.
    ports:
      - '3000:3000'

    # Volume mounts sync files between host and container in real time.
    # First mount: syncs the entire project directory into /app.
    # This is what enables hot reload — changes on host appear in container instantly.
    # Second mount: anonymous volume at /app/node_modules.
    # This prevents the host's node_modules from overwriting the container's
    # node_modules (which were built for Linux, not Windows).
    volumes:
      # [Adjustment]: project uses /src directory for nextjs source code.
      - ./src:/app/src

    # TODO: Pass all required environment variables from the host into the container.
    # The .env.local file is gitignored and must NOT be copied into the image.
    # Instead, list each NEXT_PUBLIC_ variable here explicitly using the
    # ${VARIABLE_NAME} syntax which reads from your host machine's .env.local.
    # Required variables: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
    # NEXT_PUBLIC_GRAPHQL_URL

    # [DOCS INVESTIGATION]: Read Docker Compose environment variable documentation
    # to understand the difference between `environment:` and `env_file:` directives
    # and explain why `environment:` with explicit variable names is preferred here
    # over pointing directly at .env.local via `env_file:`.

    # [Answer]: env_file allows the developer to store repetitive variables into a single file for use across multiple services, over needing multiple docker-compose files for each image. Additionally, using environment allows the developer to cherry pick which variables to use, and keeps them from hitting the image filesystem. The difference is in security, where environment prevents users from ever recovering important information stored in .env files like .env.local.
    environment:
      - NODE_ENV=development
      # [Answer]:
      - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
      - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
      - NEXT_PUBLIC_GRAPHQL_URL=${NEXT_PUBLIC_GRAPHQL_URL}
```

---

## 🛡️ Challenge & Review

Complete both TODOs in the code above before answering the questions below. Your answers must
demonstrate comprehension — not quotation from the tutorial.

**1.** The `Dockerfile` copies `package.json` and `package-lock.json` before copying the rest
of the source files. This is a deliberate layer caching strategy. Without referencing the
tutorial, explain what would break about the caching behavior if you changed the `Dockerfile`
to copy all files first and run `npm ci` second — and describe a real-world scenario where
this ordering difference would cost meaningful CI build time.

```
[Answer]: Running npm ci second would cause the container to reinstall all the dependecies by default. This would make the caching useless, as it would never be used to prevent dependency reinstallation. In production environments, this would cause small changes that don't affect package.json to cause longer wait times and bring uptime to a halt.
```

**2.** The `/app/node_modules` anonymous volume entry in `docker-compose.yml` is doing something
non-obvious. Without referencing the tutorial, explain what would happen to the container's
Linux-compiled `node_modules` if this volume entry were removed, and why that would cause the
application to fail despite the host's `node_modules` being present and complete.

```
[Answer]: Removing the node_modules volume would cause failure since the installed dependencies on the host machine are not Linux-compatible.
```

**3.** You have `.env.local` in `.dockerignore`. A teammate suggests removing it from
`.dockerignore` and instead adding it to the `Dockerfile` as `COPY .env.local .` to simplify
the environment variable setup. Write a precise technical argument for why this is a critical
security mistake, even if the Docker image is never pushed to a public registry.

```
[Answer]: Users can download the container and gain access directly to the file. This exposes *critical* information like service keys and account-specific URLs which would provided access to the development environment
```
