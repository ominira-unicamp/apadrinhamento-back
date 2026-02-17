FROM node:25

WORKDIR /usr/app

ARG SECURE=false

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma

COPY src ./src

EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
