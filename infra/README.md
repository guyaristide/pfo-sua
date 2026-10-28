# infra

Conteneurs, environnements et déploiement de SUA (livrable L-06 de l'offre technique).

## Recette (QA) sur Coolify · https://sua.poc-demo.com

Le dépôt porte un `docker-compose.yml` à la racine, lu par Coolify.

| Service | Image | Rôle |
|---|---|---|
| `front` | `infra/docker/front.Dockerfile` : build Vite dans Node 22, fichiers servis par nginx | L'application, et le relais `/api` vers le service `api` |
| `api` (en commentaire, profil `api`) | `infra/docker/api.Dockerfile`, à écrire avec le backend Quarkus | L'API sous `/api` |
| `db` (en commentaire, profil `api`) | `pgvector/pgvector:pg16` | PostgreSQL + pgvector (offre technique T-03) |

Les services `api` et `db` sont en commentaire dans le compose tant que le backend n'existe pas : seul le front est construit et démarré ; `/api/` répond 502 et le front tourne sur données simulées.

### Mise en place dans Coolify

1. Nouvelle ressource → **Docker Compose** → dépôt `pfo-sua`, branche de recette, chemin `docker-compose.yml`.
2. Sur le service `front`, renseigner le domaine `https://sua.poc-demo.com` (Coolify pose Traefik et le certificat).
3. Variables d'environnement : copier `infra/coolify/qa.env.example` (phase 1). Les `VITE_*` sont des arguments de build : un changement impose un nouveau déploiement.
4. Déployer. Contrôle : `https://sua.poc-demo.com/healthz` répond `ok`, l'écran de connexion s'affiche, le code simulé est visible (`VITE_MOCK_EXPOSE_LOGIN_CODE=true`).

### Quand l'API arrive

1. Écrire `infra/docker/api.Dockerfile` (Quarkus, port 8080, racine HTTP `/api`) et décommenter `api`, `db` et le volume dans `docker-compose.yml`.
2. Dans Coolify : `COMPOSE_PROFILES=api`, `POSTGRES_PASSWORD` généré par Coolify, `VITE_DATA_SOURCE=http`, `VITE_API_BASE_URL=/api`, `VITE_MOCK_EXPOSE_LOGIN_CODE=false`.
3. Redéployer : le front appelle `https://sua.poc-demo.com/api/...`, relayé par nginx vers `api:8080` à l'intérieur du réseau du projet.

Le domaine se pose sur le service `front`, port 80 (si Coolify ne le détecte pas, écrire `https://sua.poc-demo.com:80`).

### Vérification locale

```bash
docker compose build front
docker compose up front                      # réseau compose : le relais /api résout « api » par le DNS interne
curl -s http://localhost/healthz             # ajouter ports: ["8080:80"] localement si besoin
```

Lancée seule avec `docker run` (hors réseau compose), l'image journalise des erreurs de résolution sur `/api` : le DNS interne de Docker (127.0.0.11) n'existe que dans un réseau compose. Sans l'API, `/api/` répond 502.

Image front : environ 50 Mo (nginx alpine + bundle). Construite le 28/10/2026 : `/healthz` ok, routes de l'application en 200, actifs empreintés en cache un an, `index.html` sans cache, gzip actif.

Règles applicables : `/Users/neiba/workspaces/rules/backend/identity-and-gitops-rules.md` (notamment la règle 39 : le drapeau qui expose le code de connexion dit son nom et vaut faux par défaut).
