FROM caddy:2.7.3-builder AS builder

WORKDIR /opt/src

COPY api.go .
COPY constants.go .
COPY go.mod .
COPY go.sum .
COPY info.go .
COPY main.go .
COPY piles_api.go .
COPY utils.go .
COPY deck deck

RUN go build -o main .

FROM caddy:2.7.3-alpine

WORKDIR /opt/app

COPY --from=builder /opt/src/main .

COPY assets assets
COPY static static

# Cannot use volume in Railway
#VOLUME /opt/app/assets
#VOLUME /opt/app/static

ENV PORT=3000

EXPOSE ${PORT}

ENTRYPOINT /opt/app/main --enableCORS --port=${PORT}
