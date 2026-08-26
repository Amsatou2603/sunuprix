# Design SunuPrix

Ce dossier contient les éléments d'identité visuelle utilisés par le frontend.

## Logo et icônes

Le logo officiel — un baobab bas-poly (facettes géométriques) vert foncé
`#0F6E56` cerclé d'or `#EF9F27`, sur un halo crème `#F7F5EF`, posé dans un
badge circulaire à anneau doré, avec une flèche à chevrons (or/crème) évoquant
la croissance à sa base — a été fourni en référence sous forme d'un rendu
(`reference-logo.png`, conservé ici pour traçabilité). Il a été reproduit
fidèlement en SVG vectoriel afin d'être exploitable à toutes les tailles
(favicon, icônes PWA, en-tête) :

- `icon.svg` — le badge circulaire seul (anneau or, halo, arbre, chevrons).
  Utilisé pour le favicon et le logo de l'en-tête, exactement comme dans la
  maquette web (favicon + en-tête).
- `icon-app.svg` — le badge inséré dans une carte à coins arrondis vert très
  foncé `#0B2E24`, pour les icônes d'application mobile / PWA (192, 512,
  Apple Touch), conformément à la maquette "version mobile (app icon)".
- `icon-maskable.svg` — même composition qu'`icon-app.svg` mais en plein
  cadre (sans coins arrondis) et avec une marge de sécurité plus large,
  requise par la spécification des icônes "maskable" Android.
- `logo.svg` — lockup complet (badge + nom "SunuPrix") pour l'en-tête du site.

Les fichiers PNG dérivés (favicon, icônes 192/512, icône Apple Touch, icône
maskable) sont générés dans `/frontend/public/icons`. Si la charte évolue
(nouvelle teinte, nouveau tracé), modifier les SVG sources ci-dessus puis
régénérer les PNG dérivés — ne jamais éditer les PNG directement.

## Maquettes (`maquettes/`)

Les captures d'écran de référence partagées avec la demande (tableaux de bord
par rôle, page d'accueil, écrans mobiles, présentation du logo) sont
conservées ici pour servir de référence lors des passes de finition visuelle
(phase 3 du plan d'implémentation) : comparaison des espacements, couleurs,
badges et typographies de chaque écran par rapport à la maquette
correspondante.
