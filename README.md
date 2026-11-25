# ACME-Corps

Site témoin UX/UI et terrain d’essai de modules ASF. V0 pose une référence volontairement encombrée. Ses parcours de devis, de SAV, de suivi, de maintenance et de calcul des besoins sont utilisables avec des données fictives.

## Rejouer V0

Servez `dist` avec un serveur statique. La racine ouvre `/v0/`. Conservez le dossier `dist/v0` pour retrouver l’interface, les données initiales et les comportements du premier passage. Une version suivante peut utiliser un autre répertoire et faire pointer l’accueil vers celui-ci.

Les dossiers créés sont conservés dans le stockage local du navigateur sous la clé `acme-corps.v0.dossiers`. Pour un passage avec les données initiales, ouvrez une session de navigation privée neuve. Le **Relevé de passage**, accessible dans le pied de page, démarre depuis l’accueil, observe le temps écoulé, les écrans, les clics et les opérations abouties, puis exporte les événements JSON. Il se déroule dans l’onglet et ne transmet aucune donnée.

## Reprendre les modules

`dist/v0/industry.mjs` porte les articles, sites, équipements, stocks, nomenclatures, dossiers et états. `screens.mjs` présente les données. `portal.mjs` relie les routes et les formulaires au modèle. Devis, SAV et maintenance partagent le registre, les références et l’historique. Un nouveau type de dossier peut donc adopter le même suivi. Le module de calcul réutilise le même référentiel d’articles que le catalogue.

Ce socle statique permet de comparer les parcours. Les indicateurs personnels et la première hypothèse de correction restent à décider après l’essai de V0.
