# Intégration continue — Innov'Events

## Objectif

Le projet Innov'Events utilise GitHub Actions afin de vérifier automatiquement la qualité et le bon fonctionnement du code avant son intégration dans les branches principales.

L'intégration continue permet de détecter rapidement :

- les erreurs de configuration Django ;
- les migrations manquantes ;
- les tests backend en échec ;
- une baisse de la couverture des tests ;
- les erreurs ESLint du frontend ;
- les erreurs de compilation de l'application React.

Le workflow est défini dans le fichier :

```text
.github/workflows/ci.yml
```

---

## Déclenchement du workflow

La CI est exécutée automatiquement dans les cas suivants :

- lors d'un push sur la branche `dev` ;
- lors d'un push sur la branche `main` ;
- lorsqu'une Pull Request cible `dev` ou `main` ;
- lors d'un lancement manuel depuis l'onglet Actions de GitHub.

Configuration utilisée :

```yaml
on:
  push:
    branches:
      - dev
      - main

  pull_request:
    branches:
      - dev
      - main

  workflow_dispatch:
```

---

## Organisation du workflow

Le workflow contient deux jobs indépendants :

- `Backend Django` ;
- `Frontend React`.

Les deux jobs s'exécutent en parallèle sur des machines virtuelles Ubuntu fournies par GitHub Actions.

```text
CI InnovEvents
├── Backend Django
└── Frontend React
```

---

# Job Backend Django

## Environnement utilisé

Le job backend utilise :

- Ubuntu ;
- Python 3.12 ;
- PostgreSQL 16 ;
- MongoDB 7.

PostgreSQL est utilisé pour les données relationnelles de l'application.

MongoDB est utilisé pour la journalisation des actions sensibles.

## Services de base de données

GitHub Actions démarre automatiquement un conteneur PostgreSQL et un conteneur MongoDB pendant l'exécution du workflow.

Les bases de données créées dans la CI sont temporaires et supprimées à la fin du job.

### Service PostgreSQL

```yaml
services:
  postgres:
    image: postgres:16
    env:
      POSTGRES_DB: innovevents
      POSTGRES_USER: innovevents
      POSTGRES_PASSWORD: innovevents_pwd
    ports:
      - 5432:5432
```

### Service MongoDB

```yaml
services:
  mongo:
    image: mongo:7
    env:
      MONGO_INITDB_ROOT_USERNAME: innovevents
      MONGO_INITDB_ROOT_PASSWORD: innovevents_mongo_pwd
      MONGO_INITDB_DATABASE: innovevents_logs
    ports:
      - 27017:27017
```

---

## Variables d'environnement du backend

Le job backend utilise les variables suivantes :

```yaml
env:
  SECRET_KEY: ci-secret-key
  DEBUG: "0"
  ALLOWED_HOSTS: localhost,127.0.0.1
  DATABASE_URL: postgresql://innovevents:innovevents_pwd@127.0.0.1:5432/innovevents
  REQUIRE_DB_SSL: "0"
  MONGO_URL: mongodb://innovevents:innovevents_mongo_pwd@127.0.0.1:27017/innovevents_logs?authSource=admin
  MONGO_DB: innovevents_logs
  CORS_ALLOWED_ORIGINS: http://localhost:5173
```

Ces valeurs sont utilisées uniquement dans l'environnement temporaire de GitHub Actions.

Aucun secret de production réel n'est stocké dans ce fichier.

---

## Étapes du job backend

### 1. Récupération du dépôt

```yaml
- name: Récupérer le dépôt
  uses: actions/checkout@v4
```

Cette étape télécharge le code du dépôt dans la machine temporaire GitHub Actions.

### 2. Installation de Python

```yaml
- name: Installer Python
  uses: actions/setup-python@v5
  with:
    python-version: "3.12"
```

Cette étape installe Python 3.12.

### 3. Installation des dépendances

```yaml
- name: Installer les dépendances Python
  run: |
    python -m pip install --upgrade pip
    pip install -r requirements.txt
```

Les dépendances sont installées depuis :

```text
apps/back/requirements.txt
```

### 4. Vérification de Django

```yaml
- name: Vérifier la configuration Django
  run: python manage.py check
```

Cette commande vérifie notamment :

- la configuration Django ;
- les applications installées ;
- les modèles ;
- les routes ;
- les paramètres généraux du projet.

### 5. Vérification des migrations

```yaml
- name: Vérifier les migrations
  run: python manage.py makemigrations --check --dry-run
```

Cette commande vérifie qu'aucune modification de modèle n'a été effectuée sans créer la migration correspondante.

La CI échoue si une migration est manquante.

### 6. Application des migrations

```yaml
- name: Appliquer les migrations
  run: python manage.py migrate --noinput
```

Les migrations sont appliquées sur la base PostgreSQL temporaire.

### 7. Exécution des tests avec couverture

```yaml
- name: Exécuter les tests avec couverture
  run: coverage run --source=. manage.py test --verbosity=2
```

Cette commande :

- exécute les tests Django ;
- mesure les lignes Python parcourues par les tests ;
- enregistre les résultats de couverture.

### 8. Vérification de la couverture

```yaml
- name: Afficher le rapport de couverture
  run: coverage report -m --fail-under=60
```

La CI affiche le rapport de couverture et échoue si le taux global descend sous 60 %.

Lors de la première mesure, les résultats obtenus étaient :

```text
Nombre de lignes mesurées : 884
Nombre de lignes non couvertes : 287
Couverture totale : 68 %
```

Le seuil de 60 % permet d'éviter une baisse importante de la couverture tout en laissant la possibilité d'améliorer progressivement les tests.

---

# Job Frontend React

## Environnement utilisé

Le job frontend utilise :

- Ubuntu ;
- Node.js 20 ;
- npm ;
- Vite ;
- ESLint.

## Étapes du job frontend

### 1. Récupération du dépôt

```yaml
- name: Récupérer le dépôt
  uses: actions/checkout@v4
```

### 2. Installation de Node.js

```yaml
- name: Installer Node.js
  uses: actions/setup-node@v4
  with:
    node-version: "20"
```

### 3. Installation des dépendances

```yaml
- name: Installer les dépendances
  run: npm ci
```

La commande `npm ci` installe exactement les versions enregistrées dans le fichier :

```text
apps/front/package-lock.json
```

Cette commande est privilégiée dans un environnement d'intégration continue car elle fournit une installation reproductible.

### 4. Vérification avec ESLint

```yaml
- name: Vérifier le code avec ESLint
  run: npm run lint
```

ESLint analyse le code afin de détecter notamment :

- les variables inutilisées ;
- les imports incorrects ;
- les erreurs React ;
- les mauvaises pratiques liées aux hooks ;
- les problèmes de qualité de code.

Les erreurs ESLint bloquent la CI.

Les avertissements sont affichés mais ne bloquent pas actuellement le workflow.

### 5. Compilation du frontend

```yaml
- name: Compiler l'application
  env:
    VITE_API_URL: http://localhost:8000
  run: npm run build
```

Cette commande génère la version de production de l'application React avec Vite.

La CI échoue si l'application ne peut pas être compilée.

---

## Commandes équivalentes en local

### Backend

Depuis le dossier `apps/back` :

```powershell
.\.venv\Scripts\Activate.ps1
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py migrate
coverage run --source=. manage.py test --verbosity=2
coverage report -m
```

### Frontend

Depuis le dossier `apps/front` :

```powershell
npm ci
npm run lint
npm run build
```

---

## Interprétation des résultats

### Workflow vert

Un workflow vert signifie que :

- la configuration Django est valide ;
- les migrations sont à jour ;
- les tests backend réussissent ;
- la couverture est supérieure ou égale à 60 % ;
- le lint frontend ne contient aucune erreur ;
- l'application React peut être compilée.

### Workflow rouge

Un workflow rouge signifie qu'au moins une étape a échoué.

Pour identifier le problème :

1. ouvrir l'onglet `Actions` sur GitHub ;
2. sélectionner l'exécution en échec ;
3. ouvrir le job rouge ;
4. consulter l'étape ayant échoué ;
5. lire le message d'erreur ;
6. reproduire la commande localement ;
7. corriger le problème ;
8. effectuer un nouveau push.

---

## Première exécution réussie

La première version du workflow a été exécutée avec succès sur la branche `dev`.

Les deux jobs étaient valides :

```text
Backend Django : succès
Frontend React : succès
```

Le pipeline complet s'est exécuté en moins d'une minute.

Une capture d'écran de cette exécution doit être conservée dans la documentation du projet.

Emplacement conseillé :

```text
docs/captures/ci-github-actions-success.png
```

---

## Bonnes pratiques appliquées

- exécution automatique sur `dev` et `main` ;
- contrôle des Pull Requests ;
- séparation du backend et du frontend ;
- exécution parallèle des jobs ;
- installation reproductible des dépendances ;
- base PostgreSQL temporaire ;
- base MongoDB temporaire ;
- vérification des migrations ;
- tests automatisés ;
- contrôle de la couverture ;
- analyse ESLint ;
- compilation de production du frontend ;
- possibilité de lancement manuel.

---

## Limites actuelles

La CI actuelle ne vérifie pas encore :

- l'application mobile ;
- les tests end-to-end ;
- la construction des images Docker ;
- le déploiement automatique ;
- les vulnérabilités des dépendances ;
- la publication d'un rapport HTML de couverture.

Ces éléments pourront être ajoutés progressivement.

---

## Améliorations prévues

Les améliorations suivantes pourront être ajoutées ultérieurement :

- génération d'un rapport HTML de couverture ;
- publication du rapport comme artefact GitHub Actions ;
- ajout de tests fonctionnels ;
- ajout de tests end-to-end ;
- analyse des dépendances vulnérables ;
- contrôle de la construction des images Docker ;
- déploiement automatique depuis la branche `main`.

## Preuve d’exécution de la CI

### Workflow complet

![Workflow GitHub Actions réussi](captures/ci-github-actions-success.png)
