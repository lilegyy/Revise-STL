# Révise STL sur iPhone : projet pour fabriquer le .ipa

Ce dossier est le **projet source**, pas encore un fichier .ipa compilé. La génération du projet et les tests des calculs/écrans ont été effectués sur Windows. La compilation Swift avec Xcode, l’installation via AltStore et la connexion réelle à ÉcoleDirecte restent à vérifier sur Mac/iPhone.

La solution de compilation préparée est GitHub Actions : un Mac hébergé compile le projet, puis fournit un fichier **Revise-STL-AltStore.ipa**. Aucun identifiant ÉcoleDirecte ni mot de passe Apple n’est nécessaire pour cette compilation. AltStore signe ensuite l’application sur ton compte Apple.

## Obtenir le fichier .ipa

1. Décompresse le ZIP et ouvre ton dépôt : https://github.com/lilegyy/Revise-STL
2. Ajoute le dossier **iphone-revise-stl/** à la racine du dépôt, en conservant tous ses sous-dossiers. Garde les fichiers du site actuel à leur place.
3. Ajoute le fichier de compilation au chemin exact **.github/workflows/build-ipa.yml**. Il est fourni dans le ZIP. Si tu utilises le site GitHub, tu peux créer un nouveau fichier avec ce chemin et y copier le contenu du fichier fourni.
4. Dans GitHub, ouvre l’onglet **Actions**. Si GitHub le demande, active les workflows pour ce dépôt.
5. Choisis **Fabriquer Révise STL pour AltStore**, clique sur **Run workflow**, choisis **main**, puis lance.
6. Attends la fin. Un résultat vert confirme seulement que la compilation et la préparation du paquet ont réussi ; le fonctionnement sur ton iPhone doit encore être essayé.
7. En bas de la page du résultat, télécharge l’artefact **Revise-STL-AltStore**. Décompresse le téléchargement : il contient **Revise-STL-AltStore.ipa**.
8. Importe ce .ipa dans **AltStore Classic** pour le signer et l’installer. Le paquet produit n’est pas signé pour ton appareil avant cette étape. AltStore PAL utilise un autre mode de distribution et n’est pas la procédure visée ici.

Avec un compte Apple gratuit, AltStore Classic demande le renouvellement régulier de la signature ; utilise sa fonction de rafraîchissement. Si la compilation devient rouge, ouvrir la première étape en erreur et transmettre son message : ne pas considérer le .ipa comme prêt tant que cette étape n’est pas corrigée.

La compilation se lance uniquement à ta demande, jamais automatiquement quand tu ajoutes un cours. Les éventuels quotas de GitHub Actions restent ceux de ton compte.

## Ce qui est préparé

- Interface actuelle embarquée via Capacitor, sans réécrire le site en Swift.
- Cours, exercices, cartes et laboratoire chargés depuis les fichiers JSON publics de **lilegyy/Revise-STL**, branche main. Une mise à jour pointe vers un commit précis et n’est activée que lorsque les cinq fichiers JSON sont présents et validés.
- Documents et schémas récupérés directement depuis GitHub puis conservés dans le stockage de l’application. Leur téléchargement séparé évite de tous les inclure dans le .ipa.
- Bouton **Tout télécharger hors ligne** pour préparer les ressources de la version courante. À utiliser connecté après actualisation des cours. Les fichiers déjà reçus restent disponibles si un téléchargement est interrompu.
- Écran **Mes notes**, connexion native directe à ÉcoleDirecte, question de sécurité et sélection d’un compte élève.
- Calcul des moyennes pondérées, sous-matières et groupes sans compter deux fois une même discipline ; coefficients modifiables par période et compte.
- Comparaison estimée à partir des moyennes de classe disponibles ; les données manquantes sont signalées.
- Les notes sont sauvegardées dans des fichiers privés protégés sur l’iPhone ; les jetons de connexion dans le trousseau iOS. Le mot de passe n’est pas enregistré sur disque, mais est conservé temporairement en mémoire si une question de sécurité est en cours.
- Bouton de déconnexion qui efface les notes et la session. La progression de révision n’est pas effacée par cette action.
- Export de progression via le menu de partage iOS et import avec le dispositif déjà présent dans l’application.

Les nouveaux cours compatibles avec la structure actuelle arrivent sans reconstruire le .ipa. L’interface et les fonctions natives sont embarquées ; une modification de ces fonctions nécessite une nouvelle compilation. Les modifications GitHub téléchargent du contenu pédagogique, pas une nouvelle connexion native.

## Première utilisation

Ouvrir l’application connecté. Laisser l’actualisation des cours se terminer, puis toucher **Tout télécharger hors ligne** pour recevoir aussi les documents et schémas. Ceux ouverts individuellement sont également conservés. Tant qu’ils n’ont pas été téléchargés, ils peuvent être indisponibles sans connexion.

Dans **Mes notes**, utiliser le compte **élève**, pas le compte parent : cette première version ne prend en charge que les comptes élèves. Répondre à la question de sécurité uniquement si tu connais la réponse. Si la session expire, se reconnecter ; le mot de passe n’étant pas conservé, la reconnexion n’est pas entièrement automatique.

Vérifier les coefficients affichés. ÉcoleDirecte peut les masquer ou ne pas les fournir. Aucun coefficient du bac n’est deviné automatiquement. Les coefficients personnalisés permettent une moyenne de suivi ; ce n’est pas une estimation complète officielle du résultat au bac, qui inclut d’autres épreuves et les règles de ta session.

## Conserver la progression de la PWA

La PWA et l’application native possèdent des espaces de stockage distincts. Avant de changer, exporter la progression depuis **Ma progression** dans l’ancienne application, puis importer ce fichier dans l’application iPhone. Les identifiants de cours/cartes existants sont conservés ; le cache Safari ne se transfère pas automatiquement.

Ne pas désinstaller l’application avant d’avoir sauvegardé les progrès que tu souhaites conserver. Les notes peuvent être récupérées à nouveau depuis ÉcoleDirecte après connexion.

## Limites de validation actuelles

Les dix tests de calcul couvrent les zéros, notes absentes, coefficients décimaux et nuls, barèmes, sous-matières, groupes, moyennes de classe manquantes et périodes sans notes. Les écrans et le parcours de connexion ont été testés dans Chrome avec un profil iPhone 12 et **des réponses natives fictives**.

Cela ne valide pas le fonctionnement réel de la couche Swift, du trousseau, de la question de sécurité ÉcoleDirecte ou de la signature AltStore. Le protocole ÉcoleDirecte peut évoluer ; un essai réel sur ton téléphone est nécessaire après compilation. Ne pas publier d’identifiants, de mots de passe ni d’exports de notes sur GitHub ou dans les journaux de compilation.

## Sources techniques

Capacitor 8.5.3 est fixé dans les dépendances et le fichier de verrouillage. Documentation : https://capacitorjs.com/docs/ios

Le protocole ÉcoleDirecte a été étudié dans le dépôt public de MoyennesED de Diego Fino : https://github.com/diegofino15/moyennesed-v4 . Ce projet de référence est sous licence CC BY-NC-SA 4.0. Les fichiers de référence téléchargés pour l’étude ne sont pas inclus dans ce paquet et son application complète n’est pas copiée.

AltStore Classic : https://faq.altstore.io/altstore-classic/your-altstore

## Avec un Mac personnel

Depuis le dossier iphone-revise-stl/project, installer les dépendances avec npm ci, préparer l’interface avec npm run prepare:web, ajouter iOS avec npx cap add ios, puis lancer npm run prepare:ios. Ouvrir le projet avec npx cap open ios. Le dossier généré ios/ est volontairement absent du ZIP : il est produit depuis les versions fixées des dépendances.

Le workflow fourni contient la procédure exacte de compilation pour iPhone et de création du dossier Payload. Utiliser Xcode 26 ou plus récent compatible avec cette version de Capacitor. Il ne s’agit pas d’un paquet pour le simulateur.
