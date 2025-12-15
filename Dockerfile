# ---------- Base ----------
FROM node:20-bookworm-slim

# ---------- System dependencies ----------
RUN apt-get update && apt-get install -y \
    openssl \
    libssl3 \
    ca-certificates \
    curl \
    git \
    php-cli \
    php-curl \
    php-mbstring \
    php-xml \
    php-zip \
    php-openssl \
    && rm -rf /var/lib/apt/lists/*

# ---------- Environment ----------
ENV NODE_ENV=production
ENV PRISMA_FORCE_NAPI=true
ENV npm_config_update_notifier=false

WORKDIR /app

# ---------- Dependency install ----------
COPY package.json ./
COPY package-lock.json ./

RUN if [ -f package-lock.json ]; then \
      npm ci --omit=dev; \
    else \
      npm install --omit=dev; \
    fi

# ---------- App source ----------
COPY . .

# ---------- Prisma ----------
RUN npx prisma generate

# ---------- Runtime ----------
EXPOSE 3000
CMD ["npm", "start"]
