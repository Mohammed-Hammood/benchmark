# ── Stage 1: build a static binary ───────────────────────────────────────────
# go.mod requires Go 1.26, so the build image must be >= 1.26
FROM golang:1.26-alpine AS build

# The official image pins GOTOOLCHAIN=local; "auto" lets Go fetch a newer
# toolchain if go.mod is bumped again, instead of failing the build.
ENV GOTOOLCHAIN=auto

WORKDIR /src

# Download modules first so this layer is cached until go.mod/go.sum change
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /out/server .

# ── Stage 2: minimal runtime image ───────────────────────────────────────────
FROM alpine:3

# /api/generate writes to ./generated_data, so the app user must own it
RUN adduser -D -u 10001 app \
    && mkdir -p /app/generated_data \
    && chown app /app/generated_data

WORKDIR /app
COPY --from=build /out/server .
USER app

ENV GIN_MODE=release
EXPOSE 8081

CMD ["./server"]
