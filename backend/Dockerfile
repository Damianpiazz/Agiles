FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

# Regenera el cliente, aplica migraciones y corre los seeders en cada arranque.
COPY docker-entrypoint.sh ./
RUN chmod +x ./docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]

EXPOSE 3000
CMD ["npm", "run", "dev"]
