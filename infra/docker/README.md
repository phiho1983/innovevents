# Innov'Events — Environnement Docker local

Ce dépôt contient la configuration Docker nécessaire pour exécuter localement les différents services de l’application **Innov'Events** :

- l’application web React ;
- l’API Django ;
- la base de données relationnelle PostgreSQL ;
- la base de données NoSQL MongoDB.

L’objectif est de pouvoir démarrer l’ensemble de l’environnement avec une seule commande grâce à Docker Compose.

---

## Prérequis

Les outils suivants doivent être installés :

- Git ;
- Docker ;
- Docker Compose.

Vérifier leur installation :

```bash
git --version
docker --version
docker compose version
```

---

## Organisation des dossiers

Les trois dossiers doivent être placés dans le même dossier parent afin que Docker puisse accéder au code du frontend et du backend.

```text
innovevents/
├── innovevents-docker/   # Configuration Docker
├── innovevents-back/     # API Django
└── innovevents-front/    # Application web React
```

Les chemins utilisés dans le fichier `docker-compose.yml` sont notamment :

```text
../innovevents-back
../innovevents-front
```

Si les dossiers portent des noms différents, les chemins définis dans le fichier `docker-compose.yml` devront être adaptés.

---

## Installation

### Linux et macOS

```bash
mkdir -p innovevents
cd innovevents

git clone <URL_BACKEND> innovevents-back
git clone <URL_FRONTEND> innovevents-front
git clone https://github.com/phiho1983/innovevents-docker.git innovevents-docker
```

### Windows PowerShell

```powershell
New-Item -ItemType Directory -Path innovevents
Set-Location innovevents

git clone <URL_BACKEND> innovevents-back
git clone <URL_FRONTEND> innovevents-front
git clone https://github.com/phiho1983/innovevents-docker.git innovevents-docker
```

---

## Configuration de l’environnement

Se placer dans le dossier Docker :

```bash
cd innovevents-docker
```

Créer le fichier `.env` à partir du fichier d’exemple.

### Linux et macOS

```bash
cp .env.example .env
```

### Windows PowerShell

```powershell
Copy-Item .env.example .env
```

Le fichier `.env` permet notamment de configurer :

- les identifiants PostgreSQL ;
- les identifiants MongoDB ;
- la clé secrète Django ;
- les hôtes autorisés ;
- les origines CORS ;
- le compte administrateur de démonstration ;
- les ports utilisés par les différents services.

Exemple :

```dotenv
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=dev-only-change-me
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

POSTGRES_DB=innovevents
POSTGRES_USER=innovevents
POSTGRES_PASSWORD=innovevents_pwd
POSTGRES_PORT=5432

MONGO_DB=innovevents_logs
MONGO_USER=innovevents
MONGO_PASSWORD=innovevents_mongo_pwd
MONGO_PORT=27017

BACKEND_PORT=8000
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8000

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=admin1234
```

> Les identifiants présentés ci-dessus sont uniquement destinés au développement local. Ils doivent être remplacés pour un environnement de production.

---

## Démarrage de l’application

Depuis le dossier `innovevents-docker`, construire les images et démarrer les services :

```bash
docker compose up --build
```

Pour lancer les services en arrière-plan :

```bash
docker compose up --build -d
```

Docker Compose démarre les services suivants :

| Service Docker | Rôle |
|---|---|
| `frontend` | Application web React |
| `backend` | API Django |
| `db` | Base de données PostgreSQL |
| `mongo` | Base de données MongoDB destinée à la journalisation |

Le backend attend que PostgreSQL et MongoDB soient disponibles avant de démarrer.

---

## Accès aux services

| Service | Adresse |
|---|---|
| Application web | `http://localhost:5173` |
| API Django | `http://localhost:8000` |
| Administration Django | `http://localhost:8000/admin` |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |

---

## Stockage des données

Les données sont conservées dans deux volumes Docker :

```text
innovevents_pgdata
innovevents_mongodata
```

Le volume `innovevents_pgdata` contient les données PostgreSQL.

Le volume `innovevents_mongodata` contient les données MongoDB, notamment les journaux d’activité de l’application.

Les données restent disponibles après l’arrêt ou le redémarrage des conteneurs.

---

## Création automatique du compte administrateur

Au démarrage, le backend peut exécuter automatiquement :

```bash
python manage.py migrate --noinput
python scripts/create_superuser.py
```

Le compte administrateur est créé à partir des variables définies dans le fichier `.env` :

```dotenv
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=admin1234
```

Le script ne recrée pas le compte si celui-ci existe déjà.

---

## Arrêt de l’application

Arrêter les services sans supprimer les données :

```bash
docker compose down
```

---

## Réinitialisation complète des bases de données

Pour supprimer les conteneurs ainsi que les volumes PostgreSQL et MongoDB :

```bash
docker compose down -v
docker compose up --build
```

> Attention : l’option `-v` supprime définitivement les données locales enregistrées dans PostgreSQL et MongoDB.

---

## Commandes utiles

### Afficher l’état des services

```bash
docker compose ps
```

### Afficher tous les journaux

```bash
docker compose logs -f
```

### Afficher les journaux du backend

```bash
docker compose logs -f backend
```

### Afficher les journaux du frontend

```bash
docker compose logs -f frontend
```

### Afficher les journaux PostgreSQL

```bash
docker compose logs -f db
```

### Afficher les journaux MongoDB

```bash
docker compose logs -f mongo
```

---

## Commandes Django

### Créer les migrations

```bash
docker compose exec backend python manage.py makemigrations
```

### Appliquer les migrations

```bash
docker compose exec backend python manage.py migrate
```

### Vérifier la configuration Django

```bash
docker compose exec backend python manage.py check
```

### Exécuter les tests

```bash
docker compose exec backend python manage.py test
```

### Créer manuellement un administrateur

```bash
docker compose exec backend python manage.py createsuperuser
```

### Ouvrir le shell Django

```bash
docker compose exec backend python manage.py shell
```

---

## Commandes PostgreSQL

Ouvrir une console PostgreSQL :

```bash
docker compose exec db psql -U innovevents -d innovevents
```

Afficher les tables :

```sql
\dt
```

Quitter la console :

```sql
\q
```

Si les valeurs `POSTGRES_USER` ou `POSTGRES_DB` ont été modifiées dans le fichier `.env`, elles doivent également être adaptées dans la commande.

---

## Commandes MongoDB

Ouvrir une console MongoDB :

```bash
docker compose exec mongo mongosh \
  --username innovevents \
  --password innovevents_mongo_pwd \
  --authenticationDatabase admin
```

Sélectionner la base utilisée pour les journaux :

```javascript
use innovevents_logs
```

Afficher les collections :

```javascript
show collections
```

Afficher les documents de la collection des journaux :

```javascript
db.logs.find().pretty()
```

Quitter la console :

```javascript
exit
```

Si les variables `MONGO_USER`, `MONGO_PASSWORD` ou `MONGO_DB` ont été modifiées dans le fichier `.env`, leurs valeurs doivent également être adaptées dans les commandes.

---

## Vérification du fonctionnement

Après le démarrage, vérifier que tous les services sont actifs :

```bash
docker compose ps
```

Les services `db` et `mongo` doivent être indiqués comme sains :

```text
healthy
```

Vérifier ensuite l’API Django :

```bash
curl http://localhost:8000
```

Puis ouvrir l’application web dans un navigateur :

```text
http://localhost:5173
```

---

## Reconstruction des services

Reconstruire tous les services :

```bash
docker compose build --no-cache
docker compose up
```

Reconstruire uniquement le backend :

```bash
docker compose build --no-cache backend
docker compose up backend
```

Reconstruire uniquement le frontend :

```bash
docker compose build --no-cache frontend
docker compose up frontend
```

---

## Résolution des problèmes courants

### Le backend ne trouve pas PostgreSQL

Vérifier l’état du service :

```bash
docker compose ps db
docker compose logs db
```

### Le backend ne trouve pas MongoDB

Vérifier l’état du service :

```bash
docker compose ps mongo
docker compose logs mongo
```

Vérifier également la variable `MONGO_URL` transmise au backend.

### Le frontend ne communique pas avec l’API

Vérifier la valeur suivante dans le fichier `.env` :

```dotenv
VITE_API_URL=http://localhost:8000
```

Vérifier également la configuration CORS du backend.

### Docker ne trouve pas le frontend ou le backend

Vérifier que les dossiers sont correctement placés :

```text
innovevents/
├── innovevents-docker/
├── innovevents-back/
└── innovevents-front/
```

Vérifier ensuite les chemins `context` et `volumes` définis dans le fichier `docker-compose.yml`.

### Un port est déjà utilisé

Modifier le port correspondant dans le fichier `.env`.

Exemple :

```dotenv
FRONTEND_PORT=5174
BACKEND_PORT=8001
POSTGRES_PORT=5433
MONGO_PORT=27018
```

---

## Sécurité

Les bonnes pratiques suivantes doivent être respectées :

- ne jamais versionner le fichier `.env` ;
- ne pas utiliser les mots de passe de démonstration en production ;
- utiliser une clé secrète Django complexe ;
- limiter les valeurs de `DJANGO_ALLOWED_HOSTS` ;
- limiter les origines autorisées par CORS ;
- ne pas exposer PostgreSQL et MongoDB publiquement ;
- sauvegarder séparément les données PostgreSQL et MongoDB ;
- remplacer les identifiants administrateur avant le déploiement.

---

## Services utilisés

L’environnement Docker utilise les images suivantes :

```text
postgres:16
mongo:7
```

PostgreSQL stocke les données relationnelles de l’application.

MongoDB stocke les journaux d’activité et les informations techniques nécessitant une structure documentaire flexible.
