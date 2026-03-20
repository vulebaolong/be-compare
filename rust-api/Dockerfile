# syntax=docker/dockerfile:1

FROM rust:1.94-alpine AS builder
WORKDIR /app

RUN apk add --no-cache musl-dev

COPY Cargo.toml Cargo.lock ./
COPY src src

RUN cargo build --release

FROM gcr.io/distroless/cc-debian12:nonroot
WORKDIR /app

COPY --from=builder /app/target/release/rust-api /app/rust-api

EXPOSE 8085

USER nonroot:nonroot

ENTRYPOINT ["/app/rust-api"]