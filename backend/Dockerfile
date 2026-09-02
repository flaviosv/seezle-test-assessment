# syntax=docker/dockerfile:1
FROM golang:1.26-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 go build -o /app/bin/backend ./main.go

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=builder /app/bin/backend /app/backend

EXPOSE 8090
ENTRYPOINT ["/app/backend"]
