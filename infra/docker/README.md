# Innovevents — Repo Docker local (Front + Back + PostgreSQL)

Ce dépôt sert uniquement à lancer **les 2 autres dépôts** (`innovevents-front` et `innovevents-back`) + une **BDD PostgreSQL** en local via **Docker Compose**.

✅ Objectif : démarrer tout le projet avec **une seule commande**.

---

## Prérequis

- Docker + Docker Compose
- Git

Vérifier :
```bash
docker --version
docker compose version
git --version
Structure obligatoire des dossiers (très important)
⚠️ Les 3 dossiers doivent être présents dans le même dossier parent, côte à côte, sinon Docker ne trouvera pas le code front/back (les chemins ../innovevents-back et ../innovevents-front ne marcheront pas).

Exemple :

innovevents/
  innovevents-docker/   # ce dépôt
  innovevents-back/     # dépôt backend (ton code)
  innovevents-front/    # dépôt frontend (ton code)
Si tes dossiers n’ont pas exactement ces noms, adapte les chemins dans docker-compose.yml.

Installation / clonage
Linux / macOS
mkdir -p innovevents && cd innovevents

git clone <URL_BACK>  innovevents-back
git clone <URL_FRONT> innovevents-front
git clone https://github.com/phiho1983/innovevents-docker.git innovevents-docker
Windows (PowerShell)
mkdir innovevents
cd innovevents

git clone <URL_BACK>  innovevents-back
git clone <URL_FRONT> innovevents-front
git clone https://github.com/phiho1983/innovevents-docker.git innovevents-docker
Démarrage
Place-toi dans innovevents-docker/ puis lance :

Linux / macOS
cp .env.example .env
docker compose up --build
Windows (PowerShell)
Copy-Item .env.example .env
docker compose up --build
Accès :

Front : http://localhost:5173

Back : http://localhost:8000

Admin Django : http://localhost:8000/admin

Postgres : localhost:5432

Compte admin Django (automatique)
Un superuser peut être créé automatiquement au démarrage (si le script scripts/create_superuser.py est présent côté backend et que les variables sont dans .env).

Exemple dans .env :

DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_PASSWORD=1234
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
Refaire les migrations (reset DB)
Le backend exécute automatiquement :

python manage.py migrate --noinput
à chaque démarrage.

Si tu veux repartir de zéro (BDD vide) :

docker compose down -v
docker compose up --build
⚠️ -v supprime le volume PostgreSQL (donc toutes les données).

Commandes utiles
Logs :

docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
Django :

docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser

