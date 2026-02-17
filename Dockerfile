FROM node:25

WORKDIR /usr/app

ARG SECURE=false

COPY package*.json ./

RUN npm ci --omit=dev

COPY prisma ./prisma

COPY src ./src

RUN if [ "${SECURE}" = "true" ]; then \
      [ -d certs ] && cp -r certs . || echo "certs folder not found in build context"; \
    fi || true

RUN npm run prisma:generate

EXPOSE 3000
CMD ["sh", "-c", "npm run prisma:deploy && npm start"]
