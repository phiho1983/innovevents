# Innovevents

Innovevents est une application de gestion commerciale destinée au secteur événementiel.

Le projet permet notamment de présenter les services de l’entreprise, gérer les prospects, créer des devis, calculer les montants HT, TVA et TTC, générer des documents PDF et accéder à certaines fonctionnalités depuis une application mobile.

Ce dépôt est organisé sous la forme d’un **monorepo** regroupant le backend, le frontend, l’application mobile et l’infrastructure Docker.

---

## Fonctionnalités principales

* Présentation publique de l’entreprise et de ses services
* Authentification sécurisée par jetons JWT
* Gestion des utilisateurs
* Gestion des prospects
* Création et suivi des devis
* Calcul automatique des montants HT, TVA et TTC
* Génération de devis au format PDF
* Administration des données avec Django Admin
* Enregistrement de données applicatives dans PostgreSQL
* Enregistrement de certaines données techniques dans MongoDB
* Interface web responsive
* Application mobile réalisée avec React Native et Expo

---

## Architecture du monorepo

```text
innovevents/
├── apps/
│   ├── back/                   # API Django REST
│   ├── front/                  # Application web React
│   └── mobile/                 # Application mobile Expo / React Native
│
├── infra/
│   └── docker/
│       ├── docker-compose.yml  # Orchestration locale
│       └── docker/
│           ├── Dockerfile-backend
│           └── Dockerfile-frontend
│
├── docs/                       # Documentation du projet
├── .github/                    # Workflows GitHub Actions
├── .gitignore
└── README.md
```

---

## Stack technique

| Composant            | Technologies                              |
| -------------------- | ----------------------------------------- |
| Frontend web         | React, Vite, React Router, GSAP, Three.js |
| Backend              | Python, Django, Django REST Framework     |
| Authentification     | JWT avec Simple JWT                       |
| Application mobile   | React Native, Expo                        |
| Base relationnelle   | PostgreSQL 16                             |
| Base documentaire    | MongoDB 7                                 |
| Génération PDF       | ReportLab                                 |
| Conteneurisation     | Docker, Docker Compose                    |
| Versionnement        | Git, GitHub                               |
| Intégration continue | GitHub Actions                            |

---

## Prérequis

Avant de lancer le projet, vérifier que les outils suivants sont installés :

* Git
* Docker
* Docker Compose
* Node.js et npm pour l’application mobile
* Expo Go sur un téléphone, ou un émulateur Android/iOS

Vérification :

```bash
git --version
docker --version
docker compose version
node --version
npm --version
```

---

## Installation du projet

### 1. Cloner le monorepo

```bash
git clone https://github.com/phiho1983/innovevents.git
cd innovevents
```

### 2. Se placer sur la branche de développement

```bash
git switch dev
```

### 3. Préparer les variables d’environnement

Sous Linux ou macOS :

```bash
cp infra/docker/.env.example infra/docker/.env
```

Sous Windows PowerShell :

```powershell
Copy-Item infra/docker/.env.example infra/docker/.env
```

Le fichier `.env` contient les paramètres nécessaires au fonctionnement local :

```env
POSTGRES_DB=innovevents
POSTGRES_USER=innovevents
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5432

MONGO_DB=innovevents_logs
MONGO_USER=innovevents
MONGO_PASSWORD=change_me
MONGO_PORT=27017

DJANGO_DEBUG=1
DJANGO_SECRET_KEY=change_me_with_a_long_random_value
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=change_me

CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

BACKEND_PORT=8000
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8000
```

Les valeurs de cet exemple sont uniquement destinées à l’environnement local.

Le fichier `.env` ne doit jamais être ajouté au dépôt Git.

---

## Lancement avec Docker

Toutes les commandes Docker peuvent être exécutées depuis la racine du monorepo.

### Vérifier la configuration

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  config
```

Cette commande doit se terminer sans erreur avant le lancement des conteneurs.

### Construire et démarrer les services

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  up --build -d
```

### Vérifier l’état des services

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  ps
```

Les services suivants doivent être démarrés :

* `db`
* `mongo`
* `backend`
* `frontend`

---

## Accès aux applications

| Service               | Adresse                     |
| --------------------- | --------------------------- |
| Frontend web          | http://localhost:5173       |
| Backend Django        | http://localhost:8000       |
| Administration Django | http://localhost:8000/admin |
| PostgreSQL            | `localhost:5432`            |
| MongoDB               | `localhost:27017`           |

---

## Lancement de l’application mobile

L’application mobile n’est pas lancée par le Docker Compose principal.

Depuis la racine du projet :

```bash
cd apps/mobile
npm ci
npx expo start
```

Il est ensuite possible d’ouvrir l’application :

* avec Expo Go sur un téléphone ;
* avec un émulateur Android ;
* avec un simulateur iOS ;
* dans un navigateur avec la commande `npm run web`.

Commandes disponibles :

```bash
npm run start
npm run android
npm run ios
npm run web
```

L’adresse de l’API utilisée par l’application mobile doit être accessible depuis le téléphone ou l’émulateur.

Depuis un téléphone physique, `localhost` désigne le téléphone lui-même et non l’ordinateur. Il faut donc utiliser l’adresse IP locale de la machine qui exécute le backend.

Exemple :

```text
http://192.168.1.50:8000
```

---

## Exécution des tests

### Tests du backend Django

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec backend python manage.py test
```

### Analyse du frontend

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec frontend npm run lint
```

### Build de production du frontend

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec frontend npm run build
```

Le projet doit être considéré comme valide lorsque :

1. les conteneurs démarrent correctement ;
2. le frontend est accessible ;
3. le backend répond ;
4. les migrations Django sont appliquées ;
5. les tests backend réussissent ;
6. le lint frontend ne retourne aucune erreur bloquante ;
7. le build frontend se termine correctement.

---

## Commandes Docker utiles

### Consulter tous les logs

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  logs -f
```

### Consulter les logs du backend

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  logs -f backend
```

### Consulter les logs du frontend

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  logs -f frontend
```

### Arrêter les conteneurs

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  down
```

### Reconstruire les images

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  up --build -d
```

### Supprimer les conteneurs et les volumes

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  down -v
```

> Attention : l’option `-v` supprime les volumes Docker et les données locales de PostgreSQL et MongoDB.

---

## Commandes Django utiles

### Appliquer les migrations

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec backend python manage.py migrate
```

### Créer les migrations

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec backend python manage.py makemigrations
```

### Créer un administrateur

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec backend python manage.py createsuperuser
```

### Ouvrir un shell Django

```bash
docker compose \
  --env-file infra/docker/.env \
  -f infra/docker/docker-compose.yml \
  exec backend python manage.py shell
```

---

## Organisation Git

Le dépôt utilise deux branches principales :

| Branche | Utilisation                               |
| ------- | ----------------------------------------- |
| `main`  | Version stable et présentable du projet   |
| `dev`   | Branche de développement et d’intégration |

Le développement courant est réalisé sur `dev`.

Avant de commencer une modification :

```bash
git switch dev
git pull origin dev
```

Avant un commit :

```bash
git status
git diff
```

---

## Documentation

La documentation complète du projet est centralisée dans le dossier `docs/`.

L’organisation prévue est la suivante :

```text
docs/
├── technical/      # Documentation technique et architecture
├── user/           # Documentation utilisateur
├── database/       # MCD, schémas et scripts SQL
├── diagrams/       # Cas d’utilisation et diagrammes de séquence
├── deployment/     # Procédures Docker et déploiement
├── testing/        # Stratégie de tests et couverture
└── project/        # Kanban, gestion de projet et livrables
```

---

## Sécurité

Les règles suivantes doivent être respectées :

* ne jamais versionner un fichier `.env` ;
* ne jamais publier de mot de passe réel ;
* utiliser une clé Django différente pour chaque environnement ;
* désactiver le mode `DEBUG` en production ;
* limiter la valeur de `ALLOWED_HOSTS` ;
* limiter les origines CORS aux domaines autorisés ;
* remplacer les identifiants administrateur par défaut ;
* utiliser HTTPS pour les environnements exposés sur Internet.

---

## État du projet

Le projet est en cours de mise en conformité pour son déploiement et sa présentation finale.

Les éléments suivis comprennent notamment :

* conteneurisation complète du monorepo ;
* automatisation des tests ;
* intégration continue ;
* déploiement automatisé ;
* documentation technique ;
* documentation utilisateur ;
* documentation de la base de données ;
* diagrammes de conception ;
* amélioration de la couverture des tests.

---

## Auteur

Projet Innovevents
Dépôt GitHub : `phiho1983/innovevents`

