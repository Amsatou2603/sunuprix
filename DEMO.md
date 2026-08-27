# Scénario de démonstration — SunuPrix

Ce document propose un déroulé chronométré pour la soutenance, couvrant
successivement les 5 rôles, le chatbot, la prédiction, les notifications et
l'installation mobile de la PWA. Durée indicative totale : **12–15 minutes**.

> Rappel à formuler en ouverture : toutes les données (prix, historiques,
> comptes, annonces) sont **fictives**, générées pour la démonstration ; le
> fonctionnement (authentification, base de données, API, prédiction,
> déploiement) est réel.

Comptes de démonstration (mot de passe identique : `SunuPrix2026!`) :

| Rôle | E-mail |
| --- | --- |
| Administrateur | `admin@sunuprix.sn` |
| Chercheur | `chercheur@sunuprix.sn` |
| Ministère | `ministere@sunuprix.sn` |
| Vendeur | `vendeur@sunuprix.sn` |
| Consommateur | `consommateur@sunuprix.sn` |

URL de démonstration : voir le tableau en tête du [README](README.md#sunuprix).

---

## 0. Introduction (30 s)

- Ouvrir l'URL Vercel de production sur ordinateur.
- Montrer la page d'accueil non connectée : logo, annonces officielles du
  Ministère affichées publiquement, boutons **Connexion** / **Inscription**.
- Une phrase de contexte : plateforme multi-rôles de suivi et de prédiction
  des prix, 5 régions, 12 produits, 24 mois d'historique simulé à partir de
  tendances et prix de référence recherchés (ANSD, relevés de marché).

## 1. Rôle Vendeur — déclarer un prix (2 min)

1. Se connecter avec `vendeur@sunuprix.sn`.
2. Aller dans **Espace vendeur** (lien de navigation propre à ce rôle).
3. Montrer l'historique des déclarations déjà faites, avec leur statut
   (`EN_ATTENTE`, `VALIDEE`, `REJETEE`) et les cartes de synthèse en tête de
   page (total, en attente, validées, rejetées — toutes calculées en direct
   depuis les données chargées, jamais codées en dur).
4. Remplir le formulaire de déclaration (produit, région, prix constaté) et
   soumettre : la nouvelle déclaration apparaît dans l'historique avec le
   statut `EN_ATTENTE`.
5. Point à souligner : un vendeur ne peut déclarer que ses propres prix, et
   ne voit que son propre historique (contrôle d'accès par rôle, vérifié par
   un test d'intégration — voir [Tests](README.md#tests)).

## 2. Rôle Administrateur — modération (2 min)

1. Se déconnecter, se reconnecter avec `admin@sunuprix.sn`.
2. Aller dans **Administration**.
3. Montrer les cartes de synthèse (utilisateurs actifs/désactivés,
   déclarations en attente), le tableau de gestion des utilisateurs (rôle,
   statut) et la file de modération.
4. Valider la déclaration créée à l'étape 1 (ou une autre en attente) :
   expliquer que son statut passe à `VALIDEE` et qu'elle devient alors
   éligible à l'historique de prix utilisé par la prédiction et les exports.
5. Montrer brièvement la configuration des seuils d'alerte par défaut du
   système.
6. Point à souligner : tenter d'ouvrir directement une URL d'un autre espace
   (ex. `/vendeur` ou `/chercheur`) avec ce compte pour illustrer que la
   garde de route (`RouteProtegee`) et le contrôle d'accès côté API
   refusent l'accès à un rôle non autorisé.

## 3. Rôle Chercheur — analyse et export (2 min)

1. Se reconnecter avec `chercheur@sunuprix.sn`.
2. Aller dans **Espace chercheur**.
3. Utiliser la vue comparative : comparer plusieurs régions pour un même
   produit (ex. le prix du riz à Dakar, Thiès et Kaolack), puis basculer sur
   la comparaison inverse (plusieurs produits pour une région).
4. Montrer la marge d'erreur affichée à côté de chaque valeur prédite.
5. Lancer l'export CSV et ouvrir le fichier téléchargé : relevés de prix
   validés + prédictions.

## 4. Rôle Ministère — vue macro et annonce (2 min)

1. Se reconnecter avec `ministere@sunuprix.sn`.
2. Aller dans **Espace Ministère**.
3. Montrer le graphique d'inflation moyenne par région et les cartes de
   synthèse (inflation nationale avec badge de variation doré/rouge, régions
   suivies, annonces publiées).
4. Publier une nouvelle annonce officielle via le formulaire.
5. Revenir sur la page d'accueil (ou se déconnecter) pour montrer que
   l'annonce apparaît immédiatement, y compris pour un visiteur non connecté.

## 5. Rôle Consommateur — alertes et notifications (2 min)

1. Se reconnecter avec `consommateur@sunuprix.sn`.
2. Aller sur **Alertes**.
3. Créer une alerte personnelle (produit, région, seuil de variation).
4. Ouvrir le **centre de notifications** (cloche dans l'en-tête) : expliquer
   que la détection de seuil compare, à chaque consultation, la dernière
   variation connue aux seuils configurés (personnel ou par défaut) et
   persiste une notification en cas de dépassement — montrer une
   notification existante générée par le seed, ou en provoquer une avec un
   seuil volontairement bas.
5. Marquer une notification comme lue.

## 6. Chatbot (1 min 30)

1. Depuis n'importe quelle page, ouvrir le widget flottant (icône en bas à
   droite).
2. Cliquer sur une des questions suggérées (ex. tendance d'un produit dans
   une région), ou poser une question libre en langage naturel.
3. Montrer la réponse ancrée sur les données réelles (prix récents,
   tendance) et l'indicateur de frappe pendant la génération.
4. Point à souligner : si `GEMINI_API_KEY` n'est pas configurée (ou en cas
   d'échec de l'appel), le chatbot bascule automatiquement sur un mode de
   repli local qui reformule une réponse à partir des mêmes données — jamais
   d'erreur visible pour l'utilisateur. Le disclaimer sous le champ de saisie
   rappelle la nature pédagogique des données.

## 7. Prédiction (déjà entrevue, à formaliser — 1 min)

1. Retourner sur **Données** (accessible à tous les rôles).
2. Sélectionner un produit et une région, montrer le graphique avec la ligne
   pointillée de prédiction au-delà du dernier point réel.
3. Expliquer en une phrase la méthode : régression linéaire pondérée par la
   récence sur l'historique **validé**, recalculée et persistée (upsert)
   plutôt que recalculée à chaque affichage.

## 8. Installation mobile de la PWA (2 min)

Sur un téléphone (ou l'outil d'inspection mobile du navigateur) :

1. Ouvrir l'URL Vercel de production dans Chrome (Android) ou Safari (iOS).
2. **Android/Chrome** : ouvrir le menu ⋮ → *Ajouter à l'écran d'accueil* /
   *Installer l'application* ; montrer l'icône SunuPrix ajoutée, l'ouvrir et
   observer le lancement en mode `standalone` (sans barre d'adresse), avec
   l'écran de démarrage généré automatiquement à partir du manifeste
   (couleur de fond crème, icône au centre).
3. **iOS/Safari** : bouton *Partager* → *Sur l'écran d'accueil* ; mêmes
   observations.
4. Consulter une page de données avec réseau actif (pour la mettre en
   cache), puis couper le réseau (mode avion) et rouvrir l'application :
   montrer que la dernière page consultée reste affichable hors-ligne, et
   qu'une tentative de rafraîchissement des données affiche l'état d'erreur
   dédié plutôt qu'un plantage — jamais d'appel `/api/*` servi depuis le
   cache.

## Clôture (30 s)

- Rappeler l'architecture en couches (routes → contrôleurs → services →
  repositories) et le monorepo à source unique de vérité (`packages/shared`).
- Mentionner la couverture de tests (régression, seuils, chatbot, RBAC) et
  le déploiement réel sur Render + Vercel avec base Neon.
- Réaffirmer que seules les données sont fictives — l'ensemble du
  fonctionnement est réel et démontré en direct.
