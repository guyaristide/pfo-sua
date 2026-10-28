# syntax=docker/dockerfile:1.7
# Front SUA : build Vite dans une image Node, puis fichiers statiques servis par nginx.
# Contexte de build = racine du monorepo (npm workspaces : package-lock à la racine).

FROM node:22.12.0-bookworm-slim AS build
WORKDIR /app

# Les variables VITE_* sont figées dans le bundle au build : elles arrivent en arguments.
ARG VITE_DATA_SOURCE=mock
ARG VITE_API_BASE_URL=/api
ARG VITE_MOCK_LATENCY_MS=250
ARG VITE_MOCK_SESSION=pmLead
ARG VITE_MOCK_AUTO_LOGIN=false
ARG VITE_MOCK_EXPOSE_LOGIN_CODE=false
ENV VITE_DATA_SOURCE=$VITE_DATA_SOURCE \
    VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_MOCK_LATENCY_MS=$VITE_MOCK_LATENCY_MS \
    VITE_MOCK_SESSION=$VITE_MOCK_SESSION \
    VITE_MOCK_AUTO_LOGIN=$VITE_MOCK_AUTO_LOGIN \
    VITE_MOCK_EXPOSE_LOGIN_CODE=$VITE_MOCK_EXPOSE_LOGIN_CODE

COPY package.json package-lock.json ./
COPY front/package.json front/
RUN npm ci --no-audit --no-fund --fetch-retries=3 --fetch-retry-maxtimeout=120000 --loglevel=error

COPY front front
RUN npm run build -w front

FROM nginx:1.27-alpine AS runtime
# Le modèle est rendu au démarrage par l'image nginx (envsubst sur les variables listées).
ENV API_UPSTREAM=http://api:8080 \
    NGINX_ENVSUBST_TEMPLATE_SUFFIX=.template
COPY infra/nginx/front.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/front/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
