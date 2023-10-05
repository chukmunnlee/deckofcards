ARG GIT_COMMIT=abcd1234

FROM golang:1.21 AS builder

WORKDIR /app

COPY go.mod .
COPY go.sum .
COPY api.go .
COPY constants.go .
COPY info.go .
COPY piles_api.go .
COPY main.go .
COPY utils.go .
COPY deck deck

RUN CGO_ENABLED=0 GOOS=linux go build -ldflags "-X 'main.GitCommit=${GIT_COMMIT}'" -o deckofcards  

FROM alpine:3.18

LABEL org.opencontainers.image.source=https://github.com/chukmunnlee/deckofcards
LABEL org.opencontainers.image.licenses=MIT

WORKDIR /app

RUN apk --no-cache add curl

COPY --from=builder /app/deckofcards /app/deckofcards

COPY static static
COPY assets assets

ENV PORT=3000

HEALTHCHECK --interval=1m --timeout=5s --start-period=5s --retries=3 \
	CMD curl -s -o /dev/null http://localhost:${PORT}/health || exit 1

ENTRYPOINT /app/deckofcards --port=${PORT} --enableCORS
