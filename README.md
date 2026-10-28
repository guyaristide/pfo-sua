# SUA · PFO Immobilier

Plateforme de Property Management de PFO Immobilier (projet « SUA »). Monorepo.

| Dossier | Contenu | État |
|---|---|---|
| `front/` | Application web React (Vite, TypeScript). UI, services consommateurs et données simulées strictement séparés. | Socle initialisé, écrans alimentés par les mocks |
| `backend/` | API métier (Java / Quarkus, PostgreSQL, selon l'offre technique signée le 19/10/2026). | À initialiser |
| `infra/` | Conteneurs, CI/CD, environnements, sauvegardes. | À initialiser |

## Démarrer

```bash
npm install
npm run dev        # front sur http://localhost:5173, données simulées
npm test           # tests unitaires et cliquets
npm run typecheck
npm run build
```

Le front démarre sur les données simulées (`VITE_DATA_SOURCE=mock`). Pour viser une API : `VITE_DATA_SOURCE=http` et `VITE_API_BASE_URL`.

## Références

- Vocabulaire métier (SUA, CRG, actif, reddition, appel de fonds) : `GLOSSAIRE.md`.
- Règles d'ingénierie et d'interface : `/Users/neiba/workspaces/rules/front` et `/Users/neiba/workspaces/rules/backend`.
- Dossier client (offres, cadrage, registres, maquettes, procédures) : `/Users/neiba/myspace/clients/PFO/immobilier`.
- Maquettes validées : Elodie Wanang (CREASIKA), prototypes du 27/10/2026 et kit `@pfo/sua-ui@1.0.0`. Le front reprend l'architecture de l'information, les parcours et les tokens, avec une densité et des composants alignés sur Lightning (SLDS).
