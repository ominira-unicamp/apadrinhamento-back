# Stage 1: Builder
FROM node:25

WORKDIR /usr/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma

COPY src ./src

RUN npm run prisma:generate

EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
