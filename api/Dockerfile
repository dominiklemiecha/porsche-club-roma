FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++ openssl
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3001
CMD ["sh","-c","npx prisma db push --skip-generate --accept-data-loss && node dist/src/main.js"]
