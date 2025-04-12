# build with the following command from the this directory
# docker build -t <your image name> -f Dockerfile ..
FROM node:23 AS builder

LABEL org.opencontainers.image.source=https://github.com/chukmunnlee/deckofcards
LABEL org.opencontainers.image.description="Deck of Card API"

WORKDIR /src

COPY docserver/eslint.config.mjs .
COPY docserver/nest-cli.json .
COPY docserver/package.json .
COPY docserver/package-lock.json .
COPY docserver/tsconfig.build.json .
COPY docserver/tsconfig.json .

COPY docserver/src src

RUN npm i -g @nestjs/cli && npm ci && npm run build

FROM node:23-alpine 

LABEL org.opencontainers.image.source=https://github.com/chukmunnlee/deckofcards
LABEL org.opencontainers.image.description="Deck of Card API"

WORKDIR /app

COPY docserver/package.json .
COPY docserver/package-lock.json .

COPY docserver/static static
COPY assets assets

COPY --from=builder /src/dist dist

RUN npm ci
RUN apk add --update curl && rm -rf /var/cache/apk/*

ENV PORT=3000 PREFIX=/api
ENV DECKS_DIR=""
ENV MONGODB_URI=mongodb://localhost:27017 DATABASE=deckofcards
ENV METRICS_PORT=9464 METRICS_PREFIX=/metrics

EXPOSE ${PORT} ${METRICS_PORT}

HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:${PORT}/app/health || exit 1

SHELL [ "/bin/sh", "-c" ]

ENTRYPOINT node dist/main.js
