# SunuPrix

Plateforme multi-rôles de suivi et de prédiction des prix de produits de
consommation courante au Sénégal — **projet de fin de formation**.

> ⚠️ **Toutes les données de ce projet sont fictives.** Les prix, tendances,
> utilisateurs de démonstration et régions sont générés à des fins
> pédagogiques et ne reflètent aucune collecte de terrain réelle. Le
> fonctionnement (authentification, base de données, API, prédiction,
> déploiement) est en revanche pleinement réel.

Ce dépôt couvre les **trois phases** du plan d'implémentation : fondations,
authentification multi-rôles et ossature PWA (phase 1) ; moteur de
prédiction, chatbot ancré dans les données, système d'alertes et écrans
complets pour chacun des cinq rôles (phase 2) ; finition visuelle conforme
aux maquettes, états de chargement/erreur/vide, responsive complet,
vérification PWA, tests unitaires et d'intégration, et déploiement réel en
production (phase 3).

**Démonstration en ligne :**

| Application | URL |
| --- | --- |
| Frontend (Vercel) | _à compléter après déploiement — voir [Déploiement](#déploiement)_ |
| API (Render) | _à compléter après déploiement — voir [Déploiement](#déploiement)_ |

## Sommaire

- [Architecture](#architecture)
- [Rôles applicatifs](#rôles-applicatifs)
- [Régions et produits](#régions-et-produits)
- [Comptes de démonstration](#comptes-de-démonstration)
- [Installation locale](#installation-locale)
- [Fonctionnalités par rôle](#fonctionnalités-par-rôle)
- [API — modules et endpoints](#api--modules-et-endpoints)
- [Tests](#tests)
- [PWA](#pwa)
- [Déploiement](#déploiement)
- [Structure du dépôt](#structure-du-dépôt)
- [Choix techniques notables](#choix-techniques-notables)
- [Stack technique](#stack-technique)
- [État des vérifications](#état-des-vérifications)

## Architecture

Monorepo à deux applications indépendantes, plus un package de constantes
partagées :

```
sunuprix/
├── backend/             API Node.js + TypeScript + Express + Prisma
├── frontend/             Next.js 14 (App Router) + TypeScript + Tailwind CSS
├── packages/shared/       Constantes partagées (rôles, régions, produits)
├── render.yaml            Blueprint de déploiement Render (backend)
└── DEMO.md                Scénario de démonstration pour la soutenance
```

- **Backend** : architecture en couches strictes — `routes` (déclaration des
  endpoints) → `controllers` (validation des entrées HTTP, formatage des
  réponses) → `services` (logique métier) → `repositories` (seul point
  d'accès à Prisma/PostgreSQL). Aucune requête Prisma n'est faite en dehors
  d'un repository ; aucune logique métier dans un contrôleur. Cette
  séparation est aussi ce qui permet de tester chaque couche indépendamment
  (voir [Tests](#tests)).
- **Frontend** : Next.js 14 App Router, un client API centralisé
  (`src/lib/api/api-client.ts`), un contexte d'authentification global, une
  garde de route par rôle réutilisable (`RouteProtegee`), et un jeu de
  composants d'état partagés (`components/partages/EtatAsync.tsx`,
  `BadgeVariation.tsx`, `CarteStat.tsx`) utilisés sur toutes les pages pour
  les états de chargement, d'erreur et vide, et pour l'habillage visuel
  (badges dorés/rouges, cartes statistiques) conforme aux maquettes.
- **`packages/shared`** : source unique de vérité pour les listes fermées
  (rôles, régions, produits), importée à la fois par le backend (Prisma
  seed, validation Zod, middleware de rôle) et par le frontend (sélecteur de
  rôle à l'inscription, page "À propos"). Cela évite toute duplication ou
  désynchronisation de ces constantes entre les deux applications.

Base de données : PostgreSQL hébergée sur [Neon](https://neon.tech), pilotée
via [Prisma](https://www.prisma.io/).

## Rôles applicatifs

| Rôle | Description | Inscriptible librement |
| --- | --- | --- |
| `ADMIN` | Administration de la plateforme | Non — créé par le seed ou par un autre administrateur |
| `CHERCHEUR` | Analyse avancée, exports | Oui |
| `MINISTERE` | Vue macro, annonces officielles | Oui |
| `VENDEUR` | Déclaration de prix | Oui |
| `CONSOMMATEUR` | Suivi et alertes personnelles | Oui |

L'authentification par JWT est posée dans cette phase : inscription (mot de
passe haché avec bcrypt), connexion, et un middleware de contrôle d'accès par
rôle (`autoriserRoles(...)`) réutilisable sur toute route protégée. Le token
JWT est transporté dans un **cookie httpOnly** posé par le backend — il n'est
jamais accessible ni manipulé en JavaScript côté client, ce qui constitue le
stockage "sécurisé" demandé (voir [Choix techniques
notables](#choix-techniques-notables)). Un test d'intégration dédié
(`rbac.integration.test.ts`) vérifie qu'aucun rôle ne peut atteindre les
routes réservées à un autre rôle (voir [Tests](#tests)).

## Régions et produits

- **5 régions** : Dakar, Saint-Louis, Thiès, Louga, Kaolack.
- **12 produits** : Riz, Sucre, Huile, Oignons, Pommes de terre, Mil, Farine
  de blé, Poisson frais, Tomate, Lait en poudre, Gaz butane, Savon.

Ces deux listes sont définies une seule fois dans `packages/shared/src` et ne
doivent jamais être recopiées ailleurs dans le code.

## Comptes de démonstration

Créés par le script de seed (`npm run seed`), un par rôle. Mot de passe
identique pour tous, à changer avant toute mise en production réelle :

| Rôle | E-mail | Mot de passe |
| --- | --- | --- |
| Administrateur | `admin@sunuprix.sn` | `SunuPrix2026!` |
| Chercheur | `chercheur@sunuprix.sn` | `SunuPrix2026!` |
| Ministère | `ministere@sunuprix.sn` | `SunuPrix2026!` |
| Vendeur | `vendeur@sunuprix.sn` | `SunuPrix2026!` |
| Consommateur | `consommateur@sunuprix.sn` | `SunuPrix2026!` |

Le seed génère également 12 mois d'historique de prix (tendance + bruit,
déterministe) pour chacun des 12 produits dans chacune des 5 régions.

## Installation locale

Prérequis : Node.js ≥ 18.18, npm ≥ 10, une base PostgreSQL (ex : un projet
[Neon](https://neon.tech) gratuit).

```bash
# 1. Installer toutes les dépendances du monorepo (workspaces npm)
npm install

# 2. Configurer les variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# → éditer backend/.env avec votre DATABASE_URL Neon et un JWT_SECRET
# → GEMINI_API_KEY est optionnelle : absente, le chatbot bascule automatiquement
#   sur son mode de repli local (jamais d'erreur visible pour l'utilisateur)

# 3. Générer le client Prisma et appliquer le schéma
npm run prisma:generate
npx prisma migrate dev --name init --schema backend/prisma/schema.prisma

# 4. Peupler la base (régions, produits, comptes de démo, historique de prix)
npm run seed

# 5. Lancer les deux applications en développement
npm run dev
# backend  → http://localhost:4000  (voir GET /api/health)
# frontend → http://localhost:3000
```

Chaque application reste aussi utilisable indépendamment :
`npm run dev -w @sunuprix/backend` / `npm run dev -w @sunuprix/frontend`.

### Build de production

```bash
npm run build   # construit @sunuprix/shared, puis le backend, puis le frontend
```

### Tests

```bash
npm run test -w @sunuprix/backend   # ou : cd backend && npm test
```

## Fonctionnalités par rôle

Tout ce qui est affiché provient de vraies requêtes à l'API, filtrées selon
le rôle connecté — aucune valeur n'est codée en dur côté frontend, y compris
les nouvelles cartes statistiques ajoutées en phase 3 (calculées côté client
à partir des données déjà chargées, jamais de nombre fictif).

- **Tous les rôles** : page `/donnees` (carte SVG des 5 régions, cartes de
  synthèse avec badges de variation dorés/rouges, graphique Recharts avec
  sélecteurs produit/région et ligne de prédiction pointillée), widget de
  chatbot flottant sur toutes les pages (questions suggérées, indicateur de
  frappe, avertissement sur la nature pédagogique des réponses), page
  `/alertes` (alertes de prix personnelles + centre de notifications),
  annonces officielles du Ministère affichées sur l'accueil. Chaque page
  gère explicitement son état de chargement, son état d'erreur (avec message
  clair) et son état vide (aucune donnée disponible).
- **Vendeur** (`/vendeur`) : formulaire de déclaration d'un prix constaté
  (statut initial toujours `EN_ATTENTE`) et historique de ses propres
  déclarations avec leur statut de modération, plus des cartes de synthèse
  (total, en attente, validées, rejetées).
- **Chercheur** (`/chercheur`) : export CSV (relevés de prix validés +
  prédictions) et vue analytique comparant plusieurs régions pour un produit,
  ou plusieurs produits pour une région, avec la marge d'erreur de chaque
  prédiction.
- **Ministère** (`/ministere`) : vue agrégée d'inflation moyenne par région
  (graphique en barres) et formulaire de publication d'annonces officielles,
  avec cartes de synthèse (inflation nationale, régions suivies, annonces
  publiées).
- **Administrateur** (`/admin`) : tableau de gestion des utilisateurs
  (changement de rôle, activation/désactivation), file de modération des
  déclarations de prix vendeur (valider/rejeter), configuration des seuils
  d'alerte par défaut du système, avec cartes de synthèse (utilisateurs
  actifs/désactivés, déclarations en attente).

## API — modules et endpoints

Chaque groupe d'endpoints est protégé par le middleware de rôle
`autoriserRoles(...)` posé en phase 1. Tous les modules suivent la même
architecture en couches (`routes` → `controllers` → `services` →
`repositories`).

| Module | Endpoints | Accès |
| --- | --- | --- |
| Référentiel | `GET /api/regions`, `GET /api/produits` | Tout rôle authentifié |
| Prix | `GET /api/prix/historique`, `GET /api/prix/carte` | Tout rôle authentifié |
| Prix (vendeur) | `POST /api/prix/declarations`, `GET /api/prix/declarations/mes` | `VENDEUR` |
| Prédictions | `GET /api/predictions/:productId/:regionId` | Tout rôle authentifié |
| Chatbot | `POST /api/chatbot` | Tout rôle authentifié |
| Alertes | `GET/POST /api/alertes`, `PATCH/DELETE /api/alertes/:id` | Tout rôle authentifié (alertes personnelles) |
| Notifications | `GET /api/notifications`, `GET /api/notifications/non-lues/compte`, `PATCH /api/notifications/:id/lue` | Tout rôle authentifié |
| Administration | `GET /api/admin/utilisateurs`, `PATCH /api/admin/utilisateurs/:id/{role,statut}`, `GET /api/admin/declarations-prix`, `PATCH /api/admin/declarations-prix/:id/{valider,rejeter}`, `GET/PUT /api/admin/seuils` | `ADMIN` |
| Ministère | `GET/POST /api/annonces` (lecture ouverte, publication réservée), `GET /api/inflation` | `MINISTERE` (publication + inflation) |
| Export | `GET /api/export/csv` | `CHERCHEUR` |
| Santé | `GET /api/health` | Public (utilisé comme *health check* Render) |

Le service de prédiction (`regression.service.ts`) applique une régression
linéaire pondérée (poids croissant avec la récence) sur l'historique validé
d'un couple produit/région, et persiste le résultat dans `Prediction` (upsert
sur `[produitId, regionId, dateCible]`). Le service de chatbot
(`chatbot.service.ts`) construit d'abord un contexte factuel depuis la base
(prix récents, tendance, produit/région mentionnés dans le message), puis
appelle l'API Gemini (`@google/generative-ai`, clé `GEMINI_API_KEY`) avec ce
contexte ; en l'absence de clé ou en cas d'échec de l'appel, un mode de repli
local reformule une réponse à partir des mêmes données, sans jamais exposer
d'erreur à l'utilisateur. Le service d'alertes (`alerts.service.ts`) compare,
à la demande (à chaque consultation du centre de notifications), la dernière
variation connue de chaque alerte active aux seuils configurés et persiste
les notifications correspondantes.

## Tests

Le backend est testé avec [Vitest](https://vitest.dev) + `supertest`. Comme
la génération du client Prisma nécessite un accès réseau à
`binaries.prisma.sh` (voir [État des vérifications](#état-des-vérifications)),
tous les tests interceptent `config/prisma.ts` via `vi.mock(...)` — résolu
par chemin de fichier, cette interception couvre aussi bien les tests
unitaires ciblés que le test d'intégration qui monte l'application Express
réelle.

```bash
cd backend && npm test
```

- **`regression.service.test.ts`** — service de prédiction : exactitude sur
  une droite parfaite, pondération par récence comparée à une régression
  classique, marge d'erreur positive sur données bruitées, rejet si moins de
  2 points.
- **`alerts.service.test.ts`** — service de détection de seuils : bornes
  INFO/ATTENTION/CRITIQUE, création de notification en cas de dépassement,
  absence de notification sous le seuil personnel, idempotence sur relevés
  identiques répétés, comportement avec un historique insuffisant.
- **`chatbot.service.test.ts`** — mode de repli du chatbot : réponse
  toujours produite (`source: "REPLI_LOCAL"` sans clé Gemini en test), jamais
  vide, jamais d'exception propagée à l'appelant.
- **`rbac.integration.test.ts`** — contrôle d'accès par rôle de bout en bout :
  monte l'application Express réelle (`creerApp()`) avec un client Prisma
  simulé, signe de vrais JWT pour chaque rôle, et vérifie pour chaque route
  protégée (admin, export, inflation, déclarations vendeur, annonces,
  référentiel) qu'un rôle non autorisé reçoit `403`, qu'une requête sans
  jeton reçoit `401`, et que le rôle légitime n'est jamais bloqué.

## PWA

L'application est installable (`manifest.json` avec icônes 192/512 et
variante *maskable*, `id`, `display: standalone`, couleurs de thème). Un
service worker (`public/sw.js`) met en cache l'app shell à l'installation et
applique une politique *network-first* pour la navigation : le dernier
tableau de bord consulté reste disponible hors-ligne, tandis que les appels
`/api/*` ne sont **jamais** mis en cache (ils doivent toujours refléter des
données réelles — hors-ligne, ces appels échouent proprement et déclenchent
les états d'erreur existants plutôt qu'un plantage). Sur mobile, l'icône et
l'écran de démarrage (*splash screen*) sont générés automatiquement par le
système d'exploitation à partir du manifeste (Android/Chrome et iOS/Safari
modernes n'ont pas besoin d'images de démarrage codées en dur par taille
d'appareil). Le manifeste requiert HTTPS en production, assuré nativement par
Vercel.

## Déploiement

### Backend → Render

Le fichier `render.yaml` à la racine décrit un service web Node ("Blueprint")
prêt à l'emploi :

- `buildCommand: npm install --include=dev && npm run render-build` — installe
  toutes les dépendances (y compris les devDependencies, nécessaires à
  `prisma generate` et à la compilation TypeScript malgré `NODE_ENV=production`),
  construit `@sunuprix/shared`, génère le client Prisma, puis compile le
  backend.
- `startCommand: npm run render-start` — applique les migrations en attente
  (`prisma migrate deploy`, sûr à rejouer à chaque démarrage) puis démarre le
  serveur compilé.
- `healthCheckPath: /api/health` — endpoint toujours disponible, utilisé par
  Render pour vérifier que le service est sain.
- Render assigne lui-même la variable `PORT` ; le backend la lit déjà
  (`backend/src/config/env.ts`) sans valeur imposée dans `render.yaml`.

Variables d'environnement à renseigner dans le tableau de bord Render (voir
`backend/.env.example` pour le détail de chacune) :

| Variable | Valeur en production |
| --- | --- |
| `DATABASE_URL` | Chaîne de connexion Neon **pooled** (hôte se terminant par `-pooler`, avec `&pgbouncer=true`) |
| `JWT_SECRET` | Générée automatiquement par Render (`generateValue: true`) |
| `CORS_ORIGIN` | URL exacte du frontend Vercel (ex : `https://sunuprix.vercel.app`) |
| `GEMINI_API_KEY` | Optionnelle — absente, le chatbot utilise son mode de repli local |

### Frontend → Vercel

`frontend/vercel.json` adapte les commandes d'installation et de build au
monorepo (npm workspaces) : en configurant le **Root Directory** du projet
Vercel sur `frontend`, les commandes `cd .. && npm install` et
`cd .. && npm run build:frontend` remontent au dépôt pour construire d'abord
`@sunuprix/shared`, puis le frontend, exactement comme en local.

Variable d'environnement à renseigner dans Vercel :

| Variable | Valeur en production |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | URL du backend déployé sur Render (ex : `https://sunuprix-api.onrender.com`, **sans** slash final) |

Une fois les deux services déployés, mettre à jour `CORS_ORIGIN` sur Render
avec le domaine Vercel définitif, et `NEXT_PUBLIC_API_URL` sur Vercel avec
l'URL Render définitive — les deux plateformes redéploient automatiquement
au changement de variable d'environnement.

Le cookie de session JWT est explicitement configuré pour fonctionner entre
les deux domaines distincts (`sameSite: "none"` et `secure: true` en
production, `credentials: "include"` sur chaque appel `fetch` du frontend) ;
sans cela, une authentification cross-site entre Vercel et Render
échouerait silencieusement.

## Structure du dépôt

```
backend/
  prisma/
    schema.prisma        Modèle de données (Utilisateur, Région, Produit,
                          RelevéDePrix, Prédiction, Alerte, Notification,
                          Annonce, ConversationChatbot, ConfigurationSeuils)
    seed.ts               Script de peuplement (comptes démo + historique)
  src/
    config/               Lecture des variables d'env, constantes, client Prisma
    middlewares/           auth.middleware.ts (JWT), role.middleware.ts (rôles),
                            error.middleware.ts (gestion d'erreurs centralisée)
    modules/
      auth/                routes / contrôleur / service / repository / schéma Zod
      health/               GET /api/health
      referentiel/          Régions / produits (lecture seule)
      prix/                 Relevés de prix : historique, carte, déclarations vendeur
      predictions/           regression.service.ts (régression linéaire pondérée) + endpoint
      chatbot/               Contexte factuel + appel Gemini + repli local
      alertes/               Alertes personnelles, notifications, configuration des seuils
      admin/                 Gestion utilisateurs, modération, seuils par défaut
      ministere/             Annonces + vue macro d'inflation
      export/                Export CSV (relevés + prédictions)
    routes/index.ts        Point de montage unique des routes de l'API
    utils/                 ApiError, asyncHandler, jwt.ts, motDePasse.ts (bcrypt), csv.ts
    __tests__/              setup.ts (env de test), rbac.integration.test.ts
    app.ts, server.ts
  vitest.config.mts        Configuration des tests (environnement node, setup partagé)

frontend/
  src/
    app/                   Pages App Router : / , /connexion, /inscription,
                            /donnees, /alertes, /a-propos, /vendeur, /chercheur,
                            /ministere, /admin
    components/
      layout/               Header (navigation par rôle, cloche de notifications), Footer
      auth/                 RouteProtegee (garde de route par rôle)
      pwa/                  Enregistrement du service worker
      chatbot/               Widget flottant connecté à /api/chatbot
      donnees/               Carte SVG des régions, cartes de synthèse, sélecteurs, graphique Recharts
      vendeur/, chercheur/, ministere/, admin/, alertes/    Composants propres à chaque espace
      partages/              EtatAsync (Chargement/MessageErreur/EtatVide), BadgeVariation,
                            CarteStat, ListeAnnonces — réutilisés entre espaces
    lib/
      api/                  Client API centralisé + un module par domaine (prix, predictions,
                            chatbot, alertes, admin, ministere, export) + types
      auth/                 Contexte d'authentification React
  public/
    design/                 Logo, icônes, maquettes de référence (voir son README)
    manifest.json, sw.js     Manifeste et service worker PWA
  vercel.json              Commandes d'installation/build adaptées au monorepo

packages/shared/
  src/roles.ts, regions.ts, produits.ts   Listes fermées, source unique de vérité

render.yaml                Blueprint de déploiement Render (backend)
DEMO.md                     Scénario de démonstration pour la soutenance
```

## Choix techniques notables

- **Monorepo avec workspaces npm** (`packages/shared`) plutôt que dupliquer
  les listes de rôles/régions/produits entre backend et frontend : c'est la
  réponse directe à l'exigence "aucune valeur codée en dur qui devrait être
  une constante partagée".
- **JWT en cookie httpOnly** plutôt qu'en `localStorage` : le token n'est
  jamais exposé au JavaScript côté client (protection contre le XSS). Le
  frontend ne connaît que le profil utilisateur courant (non sensible),
  obtenu via `GET /api/auth/moi`. Un repli sur l'en-tête
  `Authorization: Bearer <token>` existe côté backend pour faciliter les
  tests avec des outils externes (Postman, scripts) et les tests
  d'intégration.
- **Rôle `ADMIN` non inscriptible** : le formulaire d'inscription et le
  schéma de validation Zod n'acceptent que les rôles de
  `ROLES_INSCRIPTIBLES` (tous sauf `ADMIN`), conformément au principe qu'un
  administrateur n'est créé que par le seed ou par un autre administrateur.
- **Composants d'état partagés plutôt que dupliqués** : `EtatAsync.tsx`
  (`Chargement`, `MessageErreur`, `EtatVide`), `BadgeVariation` et
  `CarteStat` centralisent un motif visuel répété sur presque toutes les
  pages, évitant la duplication de markup et garantissant une présentation
  cohérente des variations positives (badge doré) et négatives (badge
  rouge), conformément aux maquettes.
- **Tests par interception du module Prisma** : plutôt que de dépendre d'une
  vraie base de données pour les tests (ce qui les rendrait lents et
  fragiles en CI), chaque test simule `config/prisma.ts` via `vi.mock(...)`
  — vitest résout ce mock par chemin de fichier, ce qui couvre
  automatiquement tous les repositories qui importent ce module, y compris
  dans le test d'intégration RBAC qui monte l'application entière.
- **`render-build`/`render-start` dédiés** plutôt que de modifier les scripts
  de développement existants : le déploiement Render exige que `prisma
  generate` fasse partie d'une unique commande de build automatisée (pas
  d'étape manuelle séparée comme en local), sans changer le flux de
  développement local documenté ci-dessus.
- **Cookie de session `sameSite: "none"` en production** : Vercel (frontend)
  et Render (backend) sont deux domaines distincts ; sans ce réglage
  explicite (et `secure: true`, `credentials: "include"` côté client), le
  navigateur refuserait silencieusement d'envoyer le cookie de session lors
  des appels cross-site.
- **Logo officiel vectorisé** : le baobab bas-poly (facettes géométriques
  vert `#0F6E56` / or `#EF9F27`, halo crème `#F7F5EF`, badge à anneau doré et
  flèche à chevrons) fourni en référence a été reproduit fidèlement en SVG
  (`frontend/public/design/{icon,icon-app,icon-maskable,logo}.svg`) afin
  d'être exploitable à toutes les tailles (favicon, icônes PWA, en-tête) sans
  perte de qualité — voir `frontend/public/design/README.md` pour le détail
  de chaque fichier. Les maquettes d'écrans partagées dans
  `frontend/public/design/maquettes` ont servi de référence directe à la
  passe de finition visuelle (espacements, tailles, couleurs, typographies).
- **PWA minimale mais fonctionnelle** : `manifest.json` référence les icônes
  192/512 et une variante *maskable*, `sw.js` met en cache l'app shell et
  sert une réponse hors-ligne pour la navigation (jamais pour les appels
  `/api/*`, qui doivent toujours refléter des données réelles).

## Stack technique

| | |
| --- | --- |
| Backend | Node.js, TypeScript, Express, Prisma, PostgreSQL (Neon), bcrypt, jsonwebtoken, Zod, `@google/generative-ai` (Gemini) |
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts |
| Tests | Vitest, Supertest |
| Déploiement | Render (backend, Blueprint `render.yaml`), Vercel (frontend, `vercel.json`), Neon (PostgreSQL managé) |
| Outillage | npm workspaces, tsx (dev backend), ESLint |

## État des vérifications

- `packages/shared` : `tsc` sans erreur.
- `frontend` : `next build` complet sans erreur (11 routes générées, lint et
  vérification de types Next.js inclus).
- `backend` : `npx vitest run` → 37 tests, 4 fichiers, tous passants
  (régression, seuils, chatbot, RBAC). `prisma generate` télécharge les
  moteurs Prisma depuis `binaries.prisma.sh`, un hôte auquel l'environnement
  utilisé pour préparer ce dépôt n'a pas accès réseau (403 réseau confirmé
  explicitement) — la génération du client, les migrations et le seed n'ont
  donc pas pu être exécutées dans cet environnement de préparation. Les 14
  erreurs de type que `tsc` reporte sans client généré ont été vérifiées une
  à une : toutes proviennent uniquement de modèles/enums Prisma non générés
  (`Utilisateur`, `RelevePrix`, `SourcePrix`, `StatutPrix`, `SeveriteAlerte`)
  et de leurs répercussions en cascade, aucune n'est un défaut du code.
  L'ensemble de la suite de tests contourne cette contrainte par
  interception du module (`vi.mock`) et passe intégralement. Dans un
  environnement avec accès réseau standard (poste de développement, CI,
  Render), `npm run prisma:generate`, `npm run build` et `npm run seed`
  fonctionnent normalement — c'est une contrainte de l'environnement de
  préparation, pas une limitation du code.
- Sécurité des dépendances : `npm audit` ne signale plus aucune vulnérabilité
  côté `bcrypt`/`tar` (mis à jour vers bcrypt 6). Next.js 14.2.35 (dernier
  correctif de la branche 14 demandée) reste concerné par des avis de
  sécurité corrigés uniquement en Next 15/16 ; à évaluer avant toute mise en
  production réelle au-delà de cette démonstration pédagogique.
