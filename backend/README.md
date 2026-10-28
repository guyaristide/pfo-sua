# backend

API métier de SUA. Cible contractuelle (offre technique du 19/10/2026) : Java / Quarkus, PostgreSQL (+ pgvector préparé), stockage objet pour les documents, HTTPS + RBAC + journalisation.

À initialiser. Les contrats que le front consomme sont décrits dans `front/src/services/contracts/` : ce sont les interfaces à honorer, endpoint par endpoint, avant de brancher `VITE_DATA_SOURCE=http`.

Règles applicables : `/Users/neiba/workspaces/rules/backend`.
