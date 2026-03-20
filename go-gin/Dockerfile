# syntax=docker/dockerfile:1

FROM golang:1.25-alpine AS builder
WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/go-api ./main.go

FROM gcr.io/distroless/static-debian12:nonroot
WORKDIR /app

COPY --from=builder /app/go-api /app/go-api

EXPOSE 8081

USER nonroot:nonroot

ENTRYPOINT ["/app/go-api"]