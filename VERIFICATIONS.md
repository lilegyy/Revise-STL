# Vérifications — Révise STL

Vérifications effectuées le 10 octobre 2026 dans le navigateur intégré de l’application.

## Conservation des contenus

- data.json est strictement identique au fichier fourni : comparaison des octets réussie.
- Empreinte SHA-256 : 9056b766f22fe6b936d37aef5b29a465e733dd41fc9f80c65f495afda3cad6f2.
- 6 chapitres, 12 énoncés et 12 corrections conservés.
- 18 SVG d’origine toujours consultables sous les schémas redessinés.
- Les 16 images d’origine sont copiées sans modification dans assets/originals.

## Affichage et navigation

- Accueil contrôlé aux largeurs de 320, 390, 844 et 1280 pixels.
- Format 390 × 844 pixels : 6 cours et 12 corrections contrôlés, aucun débordement horizontal du document ni erreur KaTeX détecté.
- Format paysage 844 × 390 : navigation mobile affichée, barre latérale masquée, aucun débordement horizontal.
- 9 fiches de manipulation contrôlées à 390 pixels : protocole présent, formules lisibles, pas de débordement horizontal.
- Changement de spécialité, affichage des corrections et lien de retour au cours vérifiés.
- Galerie des documents et zoom des schémas vérifiés ; bouton de zoom testé à 150 %.
- Recherche sans accents testée avec « conductimetrique ».
- Thème sombre persistant après rechargement vérifié.
- Progression de chapitre et repère ECE persistants après rechargement vérifiés.
- Flashcard retournée et évaluée ; progression mise à jour.
- Export d’un fichier JSON et restauration par import d’une copie de test vérifiés.

## PWA et hors connexion

- Icône Apple : PNG 180 × 180. Icônes du manifeste : PNG 192 × 192 et 512 × 512.
- Chemins relatifs et fonctionnement dans un sous-dossier vérifiés.
- 130 ressources référencées dans le cache : aucun fichier manquant.
- Après installation du service worker, le serveur local a été arrêté et son inaccessibilité confirmée.
- Serveur arrêté : rechargement de l’accueil, ouverture d’un cours d’ondes avec formules et schémas, zoom du Dean-Stark et ouverture d’une correction de distillation réussis.
- Pas de dépendance réseau pour le moteur de formules, les polices ou les images après la mise en cache complète.

## Limites des essais

Le moteur du navigateur intégré n’est pas Safari iOS. Il n’y a pas eu d’essai physique sur un iPhone 12 sous iOS 18.5, ni de contrôle de l’ajout à son écran d’accueil. L’encoche et le comportement exact des barres système doivent être vérifiés sur cet appareil après publication.

Aucun déploiement sur GitHub Pages n’a été effectué. Le test dans un sous-dossier vérifie la structure des chemins, pas les paramètres du dépôt GitHub de l’utilisateur. Les liens externes de sources demandent une connexion.

Le contrôle scientifique porte sur les fiches ajoutées, les schémas et les conditions d’application signalées. La base de cours fournie est conservée, avec ses formulations d’origine et des compléments distincts.
