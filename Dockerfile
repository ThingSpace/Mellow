# ---------- Base ----------
FROM node:22

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
    && rm -rf /var/lib/apt/lists/*

# ---------- Environment ----------
ENV NODE_ENV=production
ENV PRISMA_FORCE_NAPI=true
ENV npm_config_update_notifier=false

WORKDIR /app

# ---------- Copy app source ----------
COPY . .

# ---------- Install dependencies ----------
COPY package*.json ./
RUN npm install --omit=dev

# ---------- Prisma ----------
RUN npx prisma generate

# ---------- Runtime ----------
EXPOSE 9420
CMD ["npm", "start"]
