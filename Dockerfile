# Image de production de Scroll-up : le serveur (API + bot) sert aussi la
# Mini App construite. Utilisée par Railway (voir railway.json), et par tout
# hébergeur qui sait lancer un Dockerfile.
#
# Les données (base SQLite, photos en l'absence de chat de stockage) vont
# dans /data : monte un volume persistant à cet endroit.

FROM node:22-bookworm-slim

# openssl : utilisé par le moteur de migrations de Prisma.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Dépendances d'abord (couche mise en cache tant que les package.json ne
# changent pas). Le client Prisma est généré à l'installation : il faut le schéma.
COPY package.json package-lock.json ./
COPY shared/package.json shared/
COPY server/package.json server/prisma.config.ts server/
COPY server/prisma server/prisma
COPY app/package.json app/
COPY prototype/package.json prototype/
RUN npm ci --no-audit --no-fund

# Code, puis construction de la Mini App (app/dist).
COPY shared shared
COPY server server
COPY app app
RUN npm run build

ENV NODE_ENV=production \
    DATABASE_URL=file:/data/scroll-up.db \
    LOCAL_PHOTO_DIR=/data/photos

# Railway fournit PORT ; ailleurs, 3000 par défaut.
EXPOSE 3000

# Applique les migrations de la base, puis lance le serveur. Node est lancé
# directement (exec) pour recevoir le signal d'arrêt et s'éteindre proprement.
WORKDIR /app/server
CMD ["sh", "-c", "npx prisma migrate deploy && exec node --import tsx src/index.ts"]
