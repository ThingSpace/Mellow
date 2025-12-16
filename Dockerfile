# ---------- Base ----------
FROM node:22-slim

# ---------- System dependencies ----------
RUN apt-get update && apt-get install -y \
    libssl3 \
    openssl \
    ca-certificates \
    curl \
    git \
    php-cli \
    php-curl \
    php-mbstring \
    php-xml \
    php-zip \
    && rm -rf /var/lib/apt/lists/*

# ---------- Environment ----------
ENV NODE_ENV=production
ENV PRISMA_FORCE_NAPI=true
ENV npm_config_update_notifier=false
ENV npm_config_ignore_scripts=true
ENV NODE_OPTIONS=--openssl-legacy-provider

WORKDIR /app

# ---------- Copy app source ----------
COPY . .

# ---------- Install dependencies ----------
COPY package.json ./
RUN npm install

ENV npm_config_ignore_scripts=false

# ---------- Prisma ----------
RUN npx prisma generate

# ---------- Runtime ----------
EXPOSE 9420
CMD ["npm", "start"]
