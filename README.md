# Révise. — STL-SPCL

Une version complète, prête à déposer sur GitHub Pages. Le dossier original du Bureau est conservé ; la nouvelle version est dans le dossier Revise-STL livré avec ce guide.

## Ce que contient cette version

- Les **6 chapitres et 12 exercices corrigés d’origine**, conservés intégralement. Le fichier data.json est identique octet pour octet au fichier fourni.
- Une interface claire et sombre, une navigation mobile et une recherche dans les cours, les corrections et les protocoles.
- **20 schémas de cours vectoriels** inspirés des previews : 18 remplacent visuellement les anciens dessins, 2 complètent la solubilité et la distillation. Les anciens SVG restent consultables sous les nouveaux.
- **9 manipulations ECE** : titrage pH-métrique, conductimétrique, potentiométrique, colorimétrique, chauffage à reflux, distillation simple, distillation fractionnée, Dean-Stark, filtration sur Büchner.
- Pour chaque manipulation : montage agrandissable, objectif, principe, matériel et rôle, protocole, exploitation, erreurs à éviter, question d’oral et repères à cocher. Les previews sont utilisés pour pH-métrie, potentiométrie, Dean-Stark et Büchner ; les autres montages sont redessinés en vectoriel à partir des documents fournis.
- Les **16 images fournies** restent accessibles dans la galerie « Schémas & documents ». Les images ne sont pas des instructions adressées à l’application.
- **27 flashcards**, auto-évaluation des chapitres, exercices repris, repères ECE, export et restauration de la progression.
- Une PWA avec icônes PNG locales, marges adaptées à l’encoche, zoom tactile autorisé et ressources en cache après le premier chargement complet.

## Mettre à jour GitHub Pages

1. Décompresse **Revise-STL.zip**.
2. Copie **le contenu du dossier Revise-STL** dans le dossier déjà publié par ton dépôt GitHub Pages. Place index.html à la racine de ce dossier, avec les dossiers assets et vendor. Ne dépose pas seulement le ZIP.
3. Conserve les éventuels fichiers propres à ton dépôt, notamment CNAME si tu utilises un domaine personnalisé.
4. Enregistre les changements dans GitHub. Dans les paramètres du dépôt, section Pages, conserve la branche et le dossier utilisés pour la publication. L’application ne nécessite ni compilation, ni compte utilisateur, ni serveur applicatif.
5. Attends la fin du déploiement GitHub Pages et ouvre le lien HTTPS du site.

Les chemins sont relatifs. L’application fonctionne donc aussi sous une adresse de type https://utilisateur.github.io/nom-du-depot/.

Cette livraison n’a pas été publiée sur ton dépôt GitHub : aucun lien de dépôt ni accès GitHub n’a été fourni.

## Installer sur iPhone 12 · iOS 18.5

1. Ouvre le lien HTTPS du site dans **Safari**.
2. Touche **Partager**, puis **Sur l’écran d’accueil** et **Ajouter**.
3. Ouvre Révise depuis sa nouvelle icône.
4. Attends **Prêt hors ligne** en haut du carnet avant de couper le réseau.
5. Pour contrôler l’installation, ferme et rouvre l’application depuis l’écran d’accueil, puis essaye un cours, une correction et une manipulation sans réseau.

Les réglages incluent viewport-fit=cover, les marges safe-area sur les quatre côtés, la hauteur dynamique de fenêtre et le mode standalone. Les gestes de zoom du navigateur restent disponibles. Les images ont aussi leur propre fenêtre de zoom.

## Sur ordinateur

Ouvre le lien GitHub Pages dans un navigateur actuel. La fenêtre s’adapte à sa largeur. Le bouton de recherche permet de retrouver une notion ; le raccourci Ctrl+K (ou Cmd+K) ouvre aussi la recherche.

Pour travailler localement, utilise un serveur HTTP local de ton choix. Un double-clic sur index.html utilise le protocole file:// et ne permet pas de charger correctement les fichiers JSON ni le service worker.

## Comprendre la progression

La progression est déclarative : « maîtrisé » signifie que tu te sens capable d’expliquer et de refaire. Ce n’est pas une note prédite ni une garantie de résultat au Bac.

Les données sont enregistrées dans le navigateur de cet appareil. Elles ne sont pas synchronisées automatiquement entre PC, Safari et l’application installée. Utilise **Progrès → Exporter** pour les sauvegarder, puis **Restaurer une copie** sur l’autre appareil.

La restauration fusionne les valeurs enregistrées ; pour un même élément, la valeur du fichier importé remplace la valeur actuelle. Les données du navigateur et le cache peuvent être effacés par le système ou par l’utilisateur : garde un export si tu tiens à ta progression.

## Modifier le contenu plus tard

- index.html : structure et métadonnées PWA.
- style.css : design et adaptation des écrans.
- app.js : navigation, recherche, flashcards, progression, affichage des schémas.
- data.json : cours et exercices d’origine, inchangés.
- supplements.json : précisions scientifiques ajoutées et compléments.
- manipulations.json : les 9 fiches ECE.
- flashcards.json : les cartes de révision.
- diagrams.json : correspondance entre anciens SVG et schémas redessinés.
- assets/diagrams : schémas vectoriels et extraits des previews.
- assets/originals : documents fournis, conservés.
- vendor/katex : moteur de formules et polices, chargés localement.
- manifest.json, sw.js et icônes : installation et fonctionnement hors connexion.

Après chaque publication qui change un fichier, **incrémente VERSION dans sw.js**. Si tu ajoutes de nouveaux fichiers nécessaires hors connexion, ajoute leurs chemins à ASSETS dans ce même fichier. Une nouvelle version s’installe en arrière-plan, puis s’active lorsque les anciennes fenêtres de l’application sont fermées. La progression locale est indépendante du cache des cours.

## Précisions scientifiques

Les encadrés ajoutés signalent les hypothèses des formules, notamment la stœchiométrie de la solubilité en milieu acide, le caractère approximatif des relations de résonance et les hypothèses des bilans. Le contenu fourni reste consultable intégralement. Le cours sur les ondes est complété par la double périodicité et l’énergie des photons.

Les montages et protocoles sont des fiches générales de révision adaptées aux documents reçus. Les substances, quantités, réglages, précautions spécifiques et appels à l’examinateur sont toujours ceux du sujet ECE. Les 9 fiches ne prétendent pas couvrir toute la banque officielle des ECE.

Sources pédagogiques : [ressources STL-SPCL de Montpellier](https://spcl.ac-montpellier.fr/moodle/), [chauffage à reflux](https://tice.ac-montpellier.fr/ABCDORGA/Famille/REFLUX.htm), [distillation](https://spcl.ac-montpellier.fr/moodle/pluginfile.php/19695/mod_label/intro/seq_7_activites.pdf), [séparation et purification](https://spcl.ac-montpellier.fr/moodle/pluginfile.php/3361/mod_resource/content/6/CH4%20Separation%20et%20purification_synthese.pdf). Chaque fiche contient ses liens de référence.

Configuration web : [installation des PWA — MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable), [configuration iPhone — Apple](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

## Vérifications réalisées

Le rapport VERIFICATIONS.md décrit les essais et leurs limites. L’affichage est testé dans le navigateur intégré, notamment à 390 × 844 pixels, correspondant au format CSS de l’iPhone 12. Cela ne remplace pas un essai sur un véritable iPhone sous iOS 18.5.

## Idées pour la suite

- Répétition espacée : revoir automatiquement les cartes difficiles à J+1, J+3 et J+7.
- Mode « légender le montage » : masquer les noms du matériel et les retrouver.
- Sujets ECE chronométrés avec grille d’auto-évaluation.

Les bibliothèques et polices locales incluent leurs licences. Les droits des images fournies restent ceux de leurs auteurs d’origine.

Publication : [documentation GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
