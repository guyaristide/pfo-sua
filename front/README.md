# @sua/front

Application web de SUA. React 19, Vite, TypeScript strict, TanStack Query, React Router.

## Trois couches, une seule direction de dépendance

```
ui  ◄──  app (pages, composition)  ──►  services (contrats + hooks)  ◄──  mocks | http
```

| Dossier | Rôle | Interdits |
|---|---|---|
| `src/ui/` | Composants d'interface purs : primitives (bouton, badge, tableau…), coquille (en-tête global, barre latérale), écrans qui reçoivent leurs données **en props**. | Aucun appel réseau, aucun hook de données, aucun import de `services/` ni de `mocks/`. |
| `src/services/` | Les **contrats** (`contracts/`, interfaces et types métier), les **hooks consommateurs** (`hooks/`, `use-<verbe>-<entité>`, TanStack Query) et l'implémentation **HTTP** (`http/`, client unique qui porte la session et normalise les erreurs). | Aucun rendu, aucun import de `ui/` ni de `mocks/`. |
| `src/mocks/` | Les **données simulées** (`fixtures/`, jeu cohérent : actifs ITC, Les Trois Jardins, Badamier, Boulevard Latrille, Baie des Sirènes…) et les implémentations simulées des contrats, avec latence. | Jamais importé ailleurs que dans la composition (`src/app/services-factory.ts`) et dans les tests. |
| `src/app/` | Composition : fournisseurs, routeur, choix mock / http, **pages** qui relient un hook à un écran en traitant les trois états (chargement, erreur, vide). | — |
| `src/shared/` | Formatage (montants, dates), catalogue de statuts, registre des objets métier, habilitations. | — |
| `src/i18n/` | Le catalogue des libellés. Tout texte affiché vient d'ici. | — |

Des **cliquets** (`tests/ratchets/`) refusent toute régression de ces règles : libellé de plus de 90 caractères ou qui commente le fonctionnement du logiciel (le ton d'une application reste court et naturel), texte français en dur dans le rendu, devise écrite en dur, identifiant technique en français, import de `mocks/` hors composition, appel réseau hors de la couche HTTP, lecture du stockage de session hors de sa couche, constante de permission hors du module d'habilitation.

## Design

Tokens du kit `@pfo/sua-ui@1.0.0` (Elodie Wanang, CREASIKA) dans `src/ui/theme/sua-tokens.css`, inchangés. Le thème `backoffice` (`src/ui/theme/backoffice.css`) applique la densité et les géométries Lightning : corps 13 px, contrôles 32 px, rayon 4 px, badges pleins, pills rectangulaires, « Afficher plus » plutôt que pagination. Règles complètes : `/Users/neiba/workspaces/rules/front/salesforce-slds-ui-ux.md`.

Repris des maquettes d'Elodie : la barre latérale (sélecteur d'actif `AssetSwitcher`, neuf entrées, trame de carrés PFO dans l'espace libre), l'état vide sur trame (`EmptyState trame`), les rangées d'indicateurs. La trame est un masque CSS coloré par `--color-brand` : aucune couleur n'est figée dans le SVG.

## Écrans

| Route | Écran | Source métier |
|---|---|---|
| `/login` | Connexion par code reçu par e-mail (six chiffres, dix minutes), hors coquille | Prototype « espace-pfo », écran de connexion |
| `/` | Tableau de bord : période (aujourd'hui, trimestre passé, année, depuis le début, personnalisée), quatre indicateurs selon le rôle, détail et définition au clic | Prototype 0, E0.1 et E0.2 |
| `/assets`, `/assets/:assetId` | Patrimoine : liste, fiche avec onglets lots, locataires, société et mandat | Prototype « socle » |
| `/assets/new` | Nouvel actif en cinq étapes puis récapitulatif (Path, brouillon, erreurs après tentative) | Prototype « socle », démo du 27-28/10 |
| `/billing` | Facturation : campagne trimestrielle, contrôle, distribution tracée | Cadrage du 13/10 |
| `/collections` | Encaissements : à traiter, chèques, relevés par compte | Prototype « encaissements » |
| `/tenants/:tenantId` | Locataire : onglets Bail (conditions, échéancier, historique), Compte (facturé, réglé, solde ou réglé d'avance, filtres trimestre et rubrique, export, détail par ligne), Documents | Prototype 1, E1.6 |
| `/collections/statements/:id/reconcile` | Rapprocher un relevé : onglets Prêtes, À vérifier, Non reconnues, Écartées, Imputées ; preuve obligatoire, ventilations, hors compte locataire, qualification des écartées, fenêtre de validation, dossier mensuel soumis puis approuvé ou renvoyé ; réouverture avec motif, versions et historique | Prototypes 2A et 2F, E2.3 à E2.5 et E2.11 |
| `/collections/cheques/new` | Enregistrer un chèque : contrôles bloquants (chiffres et lettres, bénéficiaire, signature), reçu, ou chèque rendu avec la demande de nouveau règlement | Prototype 2B, E2.6 |
| `/collections/cheques/deposit`, `/collections/cheques/deposits/:id` | Remise en banque en deux temps : choisir les chèques, puis un bordereau par chèque ou « manquant » ; remises précédentes | Prototype 2B, E2.7 |
| `/collections/cheques/:id` | Chèque non repéré au relevé : crédit candidat, démarches auprès de la banque, bascule vers le rejet | Prototype 2E, E2.10 |
| `/owner/login`, `/owner/*` | Espace propriétaire, distinct : activation (mot de passe ou lien de 15 min), accueil, comptes-rendus et lecture d'un CRG, état locatif, documents | Prototype 3, E3.1 à E3.4 |
| `/arrears` | Impayés : tranches 30 / 60 / 90 j, niveaux de relance | Procédures PM / AM et contentieux |
| `/reports` | CRG : un par actif et par trimestre, du brouillon à la signature | Procédure CRG v3 |
| `/budget` | Charges et budget : initial, réestimé, réalisé, reddition | Cadrage du 13/10 |
| `/documents` | GED : type, actif, locataire, version | Offre technique D-09 |
| `/settings` | Paramètres : hub, puis une page par référentiel | Offre technique D-01 |
| `/settings/users` (+ `/new`) | Utilisateurs, matrice des rôles (§IX), invitation | Offre technique §IX |
| `/settings/billing-items` (+ `/new`, `/:id/edit`) | Rubriques facturables : CRG ou hors CRG, assiette des honoraires, TVA, périodicité | Cadrage du 13/10 |
| `/settings/calendar` (+ `/:id/edit`) | Calendrier PFO : douze échéances mensuelles, trimestrielles, annuelles ou après événement | Procédures PFO |
| `/settings/reminder-templates` (+ `/:id/edit`) | Modèles de relance par niveau : délai, canal, objet, corps | Procédure contentieux |
| `/settings/bank-accounts` (+ `/new`, `/:id/edit`) | Comptes des SCI et de PFO, cadence des relevés | Cadrage du 13/10 |
| `/settings/fees` (+ `/edit`) | Honoraires : taux, assiette, TVA, date d'effet | Procédure CRG v3 |
| autre | Adresse inconnue (règle 19), distinct de « ce dossier n'existe plus » dans les fiches | |

Tout chargement passe par `LoadingState`, qui rend le loader PFO (`src/ui/primitives/Loader.tsx`, source `public/brand/pfo-loader.svg`) ; `index.html` affiche le même fichier avant le montage de React. Un cliquet (`tests/ratchets/loading.test.ts`) refuse tout autre spinner.

**Briques partagées par les pages et les écrans** (à réutiliser avant d'écrire une variante) :

| Brique | Rôle |
|---|---|
| `app/query-state.tsx` (`QueryState`) | Les trois états d'une requête, avec le second 404 (`missing`) |
| `app/require-permission.tsx` (`RequirePermission`) | Page de geste sans le droit : état explicite et retour |
| `shared/errors.ts` (`errorMessage`) | Le texte à montrer pour une erreur, partout le même |
| `shared/labels.ts`, `shared/validation.ts` | Tables de libellés et règles de forme partagées entre écrans |
| `ListBody` | Corps d'une vue de liste : effectif, filtres en pastilles, recherche, tableau, lots de 20 |
| `Timeline` | Frise d'historique |
| `WizardPage`, `stepStatus` | Page en étapes avec Path, erreurs visibles après tentative, pied fixe |
| `FormPage`, `issuesFrom` | Page de saisie simple avec résumé d'erreurs |
| `useDismiss` | Fermeture d'un panneau flottant au clic extérieur et à Échap |

Les services simulés sont découpés par domaine dans `src/mocks/services/`, autour d'un contexte commun (`src/mocks/context.ts`) qui porte l'état mutable et les règles partagées.

Les gestes à risque sont des pages (règle 9) : `Path` pour les étapes, `DockedFooter` pour l'état et les actions, `useDraft` pour le brouillon (rangé par `services/storage/draft-store.ts`, seul module autorisé à toucher `sessionStorage`), `ToastProvider` pour le retour après mutation. Les mutations passent par des hooks `use-<verbe>-<objet>` qui invalident les requêtes concernées.

**Session.** `SessionGate` protège la coquille : sans session valide (`unauthorized`), retour à `/login` avec l'adresse demandée. Le jeton ne se lit que dans `services/http/session-store.ts` ; les mocks l'utilisent aussi (jeton `mock:<session>`), donc la connexion survit au rechargement. Un 401 en cours d'usage est signalé par `services/session-events.ts` et l'application vide son cache puis revient à la connexion avec le motif. En mocks : toute adresse `@pfo-immobilier.ci`, code `123456` (affiché à l'écran en développement, et dans un build seulement avec `VITE_MOCK_EXPOSE_LOGIN_CODE=true`), la session dépend du prénom (elea, elema, vincent). Déconnexion dans le menu du profil.

**Paramètres versionnés.** Un délai, un taux, une règle de calendrier ou un modèle de relance ne se remplace jamais : chaque modification crée une version datée (`SettingVersion` : date d'effet, auteur, motif, valeur). La version en vigueur est la plus récente dont la date d'effet est passée ; une date future programme le changement. Les objets métier (factures, relances, CRG) se calculent avec la version en vigueur à leur date, jamais avec la dernière saisie. Tout nouveau paramètre de gestion suit ce modèle (`VersionedInput`, `VersionFields`, `VersionHistory`).

Les erreurs d'un formulaire n'apparaissent qu'après une tentative d'envoi ou de passage à l'étape suivante (`FormAttemptContext`, posé par `FormPage` et par les assistants) : un formulaire vierge n'est pas en faute. En mocks, `VITE_MOCK_AUTO_LOGIN=true` ouvre la session sans l'écran de connexion (développement et captures).

**Contrôles de formulaire Lightning** (alignés sur le démonstrateur eTourisme, `demo/src/platform/backoffice/lightning` et `shared/ui/Form`). `SelectInput` est un picklist dessiné : un bouton qui porte la valeur et une liste d'options sous lui, clavier et frappe de préfixe, jamais le menu natif du navigateur. `Lookup` remplace la liste déroulante pour les listes longues (locataires, lots) : recherche, résultats avec pictogramme et sous-titre, valeur choisie en vignette retirable. `NumberInput` porte l'unité à droite (devise, %, m²) sans `type="number"`. `CheckboxField` et `RadioField` sont des boîtes dessinées. `ActionMenu` est le menu de ligne rendu en portail, ouvert vers le haut si la place manque, action destructrice en rouge. `FormPage` affiche « N erreurs » dans le pied fixe et un résumé qui renvoie à chaque champ. La recherche globale propose cinq résultats instantanés avec icône d'objet et éléments récents. Les toasts sont centrés sous l'en-tête ; une erreur reste jusqu'à sa fermeture. Seuls les sélecteurs de date et de mois restent natifs.

Les formulaires s'écrivent avec `FormPage` (en-tête, pied fixe qui compte les erreurs, envoi par le formulaire) et les champs `Field`, `TextInput`, `SelectInput`, `TextArea`, `CheckboxField`. Chaque écran de saisie exporte sa validation (`validateX`) et sa conversion (`toXInput`) : une seule règle pour le pied fixe et pour l'envoi. Les pages d'édition des paramètres sont gardées par `AdminOnly` (droit `admin`) ; la session simulée se choisit avec `VITE_MOCK_SESSION`.

Les exports « Excel » sont des CSV UTF-8 avec BOM et point-virgule (`shared/export/csv.ts`) qui reprennent les lignes filtrées à l'écran. Les jeux d'exemple des parcours (bail, état locatif) viennent du `DemoService` fourni par les mocks ; l'implémentation HTTP n'en a pas et les boutons d'exemple disparaissent.

Chaque vue de liste s'appuie sur `ListStatus` (effectif, filtres en pastilles, recherche), `useListFilter` (lots de 20) et `ShowMore`. Les actions de ligne sont des boutons sans effet tant que les parcours d'édition ne sont pas livrés.

## Commandes

```bash
npm run dev          # données simulées
npm test             # cliquets + unitaires
npm run typecheck
npm run build
```
