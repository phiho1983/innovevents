# Innovevents - repo Docker local (front + back + Postgres)

Ce repo sert uniquement à lancer **les 2 autres repos** (`innovevents-front` et `innovevents-back`) + une **BDD Postgres** en local via Docker Compose.

## Pré-requis
- Docker + Docker Compose
- Les 3 dossiers côte à côte :

```
mon-dossier/
  innovevents-docker/
  innovevents-back/
  innovevents-front/
```

## Démarrage
Dans `innovevents-docker/` :

```bash
cp .env.example .env
docker compose up --build
```

- Front : http://localhost:5173
- Back : http://localhost:8000
- Postgres : localhost:5432

## Refaire les migrations
Le backend exécute automatiquement `python manage.py migrate --noinput` à chaque démarrage.

Si tu veux repartir de zéro (DB vide) :

```bash
docker compose down -v
docker compose up --build
```

## Commandes utiles
```bash
docker compose logs -f backend
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py makemigrations
docker compose exec backend python manage.py migrate
```
# Innovevents — Lancement local avec Docker (Front + Back + PostgreSQL)

Ce dépôt sert d’**orchestrateur Docker** pour lancer en local :
- **Frontend** (dépôt séparé)
- **Backend** (dépôt séparé)
- **PostgreSQL** (conteneur Docker)

✅ Objectif : démarrer tout le projet avec **une seule commande** `docker compose up --build`.

---

## Prérequis

- Docker Desktop (Windows/Mac) ou Docker Engine + Docker Compose (Linux)
- Git

Vérifier :
```bash
docker --version
docker compose version
git --version
