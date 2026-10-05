# ── Stage 1: build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json yarn.lock* ./
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else yarn install; fi

COPY . .
RUN yarn build

# ── Stage 2: serve with nginx ────────────────────────────────────────────────
FROM nginx:alpine

# nginx.conf      = plain HTTP (local use, default)
# nginx.prod.conf = HTTPS with Let's Encrypt certificates
ARG NGINX_CONF=nginx.conf

RUN rm /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
COPY ${NGINX_CONF} /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
