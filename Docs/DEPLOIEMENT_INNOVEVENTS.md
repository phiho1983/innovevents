# Innov'Events — Guide de déploiement

Ce document décrit les deux environnements utilisés par **Innov'Events** :

- l'environnement local avec Docker Compose ;
- l'environnement en ligne avec Cloudflare Pages, Render, Neon et MongoDB Atlas.

Les mots de passe et secrets ne doivent jamais être publiés dans GitHub ni dans cette documentation.

---

## 1. Vue d'ensemble

### Environnement local

```text
Frontend React
    |
    v
Backend Django
    |
    +-------------------+
    |                   |
    v                   v
PostgreSQL local      MongoDB local
```

L'environnement local est orchestré avec Docker Compose.

### Environnement en ligne

```text
Cloudflare Pages
Frontend React
    |
    v
Render
Backend Django
    |
    +-------------------+
    |                   |
    v                   v
Neon                  MongoDB Atlas
PostgreSQL distant    MongoDB distant
```

---

## 2. Adresses de la version en ligne

### Frontend

```text
https://innovevents.pages.dev/
```

Hébergement :

```text
Cloudflare Pages
```

### Backend

```text
https://innovevents-back.onrender.com
```

Hébergement :

```text
Render
```

### PostgreSQL

Service utilisé :

```text
Neon
```

### MongoDB

Service utilisé :

```text
MongoDB Atlas
```

---

# Partie A — Environnement local

## 3. Prérequis locaux

Installer :

- Git ;
- Docker Desktop ou Docker Engine ;
- Docker Compose.

Vérifier :

```bash
git --version
docker --version
docker compose version
```

---

## 4. Cloner le dépôt

### Windows PowerShell

```powershell
git clone https://github.com/phiho1983/innovevents.git
Set-Location innovevents\infra\docker
```

### Linux et macOS

```bash
git clone https://github.com/phiho1983/innovevents.git
cd innovevents/infra/docker
```

---

## 5. Créer le fichier `.env` local

### Windows PowerShell

```powershell
Copy-Item .env.example .env
notepad .env
```

### Linux et macOS

```bash
cp .env.example .env
nano .env
```

Exemple :

```dotenv
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=change_me
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=

POSTGRES_DB=innovevents
POSTGRES_USER=innovevents
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5432

MONGO_DB=innovevents_logs
MONGO_USER=innovevents
MONGO_PASSWORD=change_me
MONGO_PORT=27017

BACKEND_PORT=8000
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8000

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=change_me
```

Toutes les valeurs `change_me` doivent être remplacées.

---

## 6. Démarrer localement

```bash
docker compose up --build -d
```

Vérifier :

```bash
docker compose ps
```

Adresses locales :

```text
Frontend : http://localhost:5173
Backend  : http://localhost:8000
Admin    : http://localhost:8000/admin
```

---

## 7. Particularités locales

En local :

- PostgreSQL est exécuté dans Docker ;
- MongoDB est exécuté dans Docker ;
- les données sont stockées dans des volumes ;
- les identifiants sont définis dans le `.env` local ;
- les mots de passe locaux sont indépendants de ceux de la version en ligne.

---

# Partie B — Environnement en ligne

## 8. Architecture en ligne

La version en ligne repose sur quatre services distincts.

| Composant | Service |
|---|---|
| Frontend React | Cloudflare Pages |
| Backend Django | Render |
| PostgreSQL | Neon |
| MongoDB | MongoDB Atlas |

Le frontend communique avec le backend Render.

Le backend communique avec Neon et MongoDB Atlas.

---

## 9. Déploiement du frontend sur Cloudflare Pages

Le frontend est déployé depuis le dossier :

```text
apps/front
```

### Commande de build

```bash
npm ci
npm run build
```

### Dossier de sortie

```text
dist
```

### Variable principale

```text
VITE_API_URL
```

Valeur attendue :

```text
https://innovevents-back.onrender.com
```

Cette variable permet au frontend d'appeler l'API distante.

### URL publique

```text
https://innovevents.pages.dev/
```

---

## 10. Déploiement du backend sur Render

Le backend Django est déployé depuis :

```text
apps/back
```

### Variables essentielles

Render doit disposer de variables équivalentes à :

```text
DEBUG
SECRET_KEY
ALLOWED_HOSTS
DATABASE_URL
REQUIRE_DB_SSL
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
MONGO_URL
MONGO_DB
DJANGO_SUPERUSER_USERNAME
DJANGO_SUPERUSER_EMAIL
DJANGO_SUPERUSER_PASSWORD
```

### Valeurs importantes

```text
DEBUG=0
REQUIRE_DB_SSL=1
```

`ALLOWED_HOSTS` doit contenir au minimum :

```text
innovevents-back.onrender.com
```

`CORS_ALLOWED_ORIGINS` doit contenir :

```text
https://innovevents.pages.dev
```

`CSRF_TRUSTED_ORIGINS` doit contenir :

```text
https://innovevents.pages.dev
https://innovevents-back.onrender.com
```

### URL publique

```text
https://innovevents-back.onrender.com
```

---

## 11. Base PostgreSQL sur Neon

Neon fournit l'URL de connexion PostgreSQL.

Elle doit être enregistrée dans Render sous :

```text
DATABASE_URL
```

Exemple de forme :

```text
postgresql://utilisateur:mot_de_passe@hote.neon.tech/base?sslmode=require
```

Ne jamais publier cette valeur réelle.

La variable suivante doit être activée :

```text
REQUIRE_DB_SSL=1
```

Le backend Django utilise cette URL pour accéder à PostgreSQL.

---

## 12. MongoDB Atlas

MongoDB Atlas fournit une chaîne de connexion distante.

Elle doit être enregistrée dans Render sous :

```text
MONGO_URL
```

Exemple de forme :

```text
mongodb+srv://utilisateur:mot_de_passe@cluster.mongodb.net/innovevents_logs
```

Ne jamais publier cette valeur réelle.

Variable complémentaire :

```text
MONGO_DB=innovevents_logs
```

MongoDB est utilisé pour la journalisation et les données documentaires prévues par le projet.

---

## 13. CORS et sécurité entre frontend et backend

Le frontend Cloudflare et le backend Render utilisent des domaines différents.

Le backend doit autoriser explicitement le domaine Cloudflare.

Configuration attendue :

```text
CORS_ALLOWED_ORIGINS=https://innovevents.pages.dev
```

Pour les protections CSRF :

```text
CSRF_TRUSTED_ORIGINS=https://innovevents.pages.dev,https://innovevents-back.onrender.com
```

Les valeurs doivent être saisies sans espace inutile.

---

## 14. Variables locales et variables en ligne

Les deux environnements sont indépendants.

| Élément | Local | En ligne |
|---|---|---|
| Frontend | localhost:5173 | Cloudflare Pages |
| Backend | localhost:8000 | Render |
| PostgreSQL | Docker | Neon |
| MongoDB | Docker | MongoDB Atlas |
| Secrets | `.env` local | Variables des plateformes |
| Admin | Compte local | Compte distant |

Modifier un mot de passe local ne modifie pas la version en ligne.

Modifier une variable Render ne modifie pas le `.env` local.

---

## 15. Compte administrateur en ligne

Le compte administrateur en ligne utilise la base Neon.

Il est donc distinct du compte local Docker.

Les variables peuvent servir à créer le compte au premier démarrage :

```text
DJANGO_SUPERUSER_USERNAME
DJANGO_SUPERUSER_EMAIL
DJANGO_SUPERUSER_PASSWORD
```

Si le compte existe déjà, modifier uniquement la variable du mot de passe ne garantit pas sa mise à jour.

Le changement doit être effectué dans l'environnement Render avec une commande Django adaptée, ou via l'administration selon les possibilités disponibles.

---

## 16. Vérifications après déploiement

### Backend

Ouvrir :

```text
https://innovevents-back.onrender.com/api/health/
```

Résultat attendu :

```json
{
  "status": "ok"
}
```

### Frontend

Ouvrir :

```text
https://innovevents.pages.dev/
```

Vérifier :

- chargement de la page ;
- absence d'erreur réseau ;
- connexion ;
- demande de devis ;
- appels API ;
- affichage des événements.

---

## 17. Ordre recommandé de déploiement

```text
1. Créer PostgreSQL sur Neon
2. Créer MongoDB sur MongoDB Atlas
3. Configurer et déployer le backend sur Render
4. Vérifier /api/health/
5. Configurer VITE_API_URL dans Cloudflare
6. Déployer le frontend sur Cloudflare Pages
7. Vérifier la connexion frontend/backend
```

Le backend doit être opérationnel avant le frontend.

---

## 18. Mise à jour du code

### Backend Render

Après un push sur la branche reliée à Render :

```text
GitHub
→ nouveau déploiement Render
→ installation des dépendances
→ migrations
→ démarrage Django
```

### Frontend Cloudflare

Après un push sur la branche reliée à Cloudflare Pages :

```text
GitHub
→ build Vite
→ génération de dist
→ publication Cloudflare Pages
```

Le comportement exact dépend des paramètres choisis dans les tableaux de bord.

---

## 19. Vérifications Git avant déploiement

```powershell
git status
git branch
git log -1 --oneline
```

Vérifier que :

- la bonne branche est utilisée ;
- aucun secret n'est présent ;
- le `.env` n'est pas suivi ;
- les fichiers nécessaires sont commités ;
- la CI est réussie.

---

## 20. Problèmes fréquents

### Erreur CORS

Symptôme :

```text
Blocked by CORS policy
```

Vérifier :

```text
CORS_ALLOWED_ORIGINS=https://innovevents.pages.dev
```

### Erreur `DisallowedHost`

Vérifier :

```text
ALLOWED_HOSTS=innovevents-back.onrender.com
```

### Erreur PostgreSQL

Vérifier :

- `DATABASE_URL` ;
- SSL ;
- identifiants Neon ;
- état de la base.

### Erreur MongoDB

Vérifier :

- `MONGO_URL` ;
- utilisateur Atlas ;
- mot de passe ;
- liste des adresses IP autorisées ;
- nom de la base.

### Frontend connecté au mauvais backend

Vérifier dans Cloudflare :

```text
VITE_API_URL=https://innovevents-back.onrender.com
```

Après modification, relancer un déploiement du frontend.

### Backend Render en veille

Selon l'offre utilisée, le premier appel peut être plus lent après une période d'inactivité.

Le frontend peut alors attendre quelques secondes avant d'obtenir une réponse.

---

## 21. Secrets à ne jamais publier

Ne jamais ajouter dans GitHub :

```text
SECRET_KEY réelle
DATABASE_URL réelle
MONGO_URL réelle
mots de passe Neon
mots de passe MongoDB Atlas
mot de passe administrateur
jetons JWT
clés d'API
```

Les secrets doivent être stockés :

- dans `.env` en local ;
- dans les variables Render ;
- dans les variables Cloudflare ;
- dans les paramètres sécurisés des services distants.

---

## 22. Synthèse

| Environnement | Frontend | Backend | PostgreSQL | MongoDB |
|---|---|---|---|---|
| Local | Docker / Vite | Docker / Django | Docker | Docker |
| En ligne | Cloudflare Pages | Render | Neon | MongoDB Atlas |

---

## Conclusion

Innov'Events dispose de deux environnements séparés :

- un environnement Docker local reproductible ;
- un environnement en ligne distribué entre Cloudflare Pages, Render, Neon et MongoDB Atlas.

Cette séparation permet de protéger les secrets, de tester localement sans affecter la production et de faire évoluer chaque composant indépendamment.