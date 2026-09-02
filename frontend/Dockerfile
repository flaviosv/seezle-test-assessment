# syntax=docker/dockerfile:1
FROM node:22-alpine AS builder
WORKDIR /src

ARG VITE_API_BASE_URL=http://localhost:8090
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /src/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
