# Mon Budget Calorique — Phase 2

Ceci est la vraie base du projet, en Next.js. Suis les étapes dans l'ordre,
une par une. Ne saute pas d'étape même si tu ne comprends pas tout —
ça marchera quand même, et tu comprendras petit à petit.

## Étape 1 — Installer les outils sur ton ordinateur

1. Installe **Node.js** (version 18 ou plus) : https://nodejs.org (bouton "LTS")
2. Installe **VS Code** (éditeur de code, gratuit) : https://code.visualstudio.com
3. Vérifie que Node est bien installé : ouvre un terminal et tape
   ```
   node -v
   ```
   Tu dois voir un numéro de version (ex. v20.11.0). Si erreur, réinstalle Node.

## Étape 2 — Récupérer le projet

1. Dézippe le fichier `calorie-app.zip` que je t'ai donné, quelque part sur ton ordinateur (ex. Bureau)
2. Ouvre le dossier `calorie-app` dans VS Code (Fichier → Ouvrir le dossier)
3. Ouvre un terminal DANS VS Code (menu Terminal → Nouveau terminal)

## Étape 3 — Installer les dépendances

Dans le terminal VS Code, tape :
```
npm install
```
Ça va télécharger tout ce dont le projet a besoin (peut prendre 1-2 minutes).

## Étape 4 — Lancer le site en local

```
npm run dev
```
Puis ouvre ton navigateur sur **http://localhost:3000**
Tu dois voir ton app calorique, identique à la version qu'on avait dans le chat.

À partir de maintenant, à chaque fois que tu modifies un fichier et que tu sauvegardes,
la page se met à jour toute seule dans le navigateur.

## Étape 5 — Mettre le code sur GitHub (sauvegarde + partage)

1. Crée un compte sur https://github.com si tu n'en as pas
2. Crée un nouveau dépôt (bouton vert "New") — appelle-le `calorie-app`, laisse-le vide
3. Dans le terminal VS Code, tape ces commandes une par une (remplace TON-USERNAME) :
   ```
   git init
   git add .
   git commit -m "Premiere version"
   git branch -M main
   git remote add origin https://github.com/TON-USERNAME/calorie-app.git
   git push -u origin main
   ```
   (Si `git` n'est pas reconnu, installe-le ici : https://git-scm.com)

## Étape 6 — Mettre l'app en ligne gratuitement (Vercel)

1. Va sur https://vercel.com et connecte-toi avec ton compte GitHub
2. Clique "Add New Project"
3. Choisis ton dépôt `calorie-app`
4. Clique "Deploy" (laisse tous les réglages par défaut)
5. Après 1-2 minutes, tu as une URL du style `calorie-app.vercel.app` — ton app est en ligne !

Chaque fois que tu push du nouveau code sur GitHub (étape 5), Vercel remet à jour
le site automatiquement.

## Ce qui fonctionne déjà dans cette version

- Calcul du budget calorique selon profil (âge, poids, taille, activité, objectif)
- Ajout d'aliments avec calories saisies manuellement
- Sauvegarde locale dans le navigateur (localStorage), jour par jour

## Ce qu'il reste à faire (prochaines phases)

- **Phase 3** : vrais comptes utilisateurs + base de données (Supabase), pour que
  les données ne restent pas juste sur un seul navigateur
- **Phase 4** : calcul automatique des calories à partir du nom de l'aliment
  (voir le commentaire `TODO Phase 4` dans `components/CalorieTracker.js`)
- **Phase 5** : rendre l'app installable comme une vraie app mobile (PWA)
- **Phase 6** : mentions légales, politique de confidentialité (RGPD)

Reviens me voir dans le chat à chaque étape si tu bloques quelque part —
colle-moi le message d'erreur exact que tu vois dans le terminal ou le navigateur.
