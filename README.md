# Innov'Events

Innov'Events est une plateforme de gestion événementielle destinée à centraliser le suivi des prospects, des clients, des événements, des devis et des échanges internes de l'agence.

Le projet comprend une application web, une API sécurisée, une application mobile ainsi que les services nécessaires au stockage des données métier et à la journalisation des actions sensibles.

## Objectifs

Innov'Events permet de :

- centraliser les informations relatives aux prospects et aux clients ;
- organiser et suivre les événements ;
- créer, calculer et générer des devis au format PDF ;
- faciliter la collaboration entre les administrateurs et les employés ;
- permettre aux clients de consulter et de traiter leurs devis ;
- accéder aux informations essentielles depuis une application mobile ;
- conserver une trace des actions sensibles réalisées dans l'application.

## Technologies utilisées

### Application web

- React
- Vite
- React Router
- GSAP
- Three.js

### API

- Python
- Django
- Django REST Framework
- Simple JWT
- Gunicorn

### Application mobile

- React Native
- Expo
- React Navigation

### Données et infrastructure

- PostgreSQL pour les données relationnelles
- MongoDB pour la journalisation
- Docker
- Docker Compose
- GitHub Actions pour l'intégration continue

## Structure du projet

```text
innovevents/
├── apps/
│   ├── back/          # API Django
│   ├── front/         # Application web React
│   └── mobile/        # Application mobile React Native
├── infra/
│   └── docker/        # Configuration Docker
├── docs/              # Documentation technique et fonctionnelle
└── README.md
```

## Prérequis

Les outils suivants doivent être installés :

- Git
- Docker
- Docker Compose

Vérification :

```bash
git --version
docker --version
docker compose version
```

## Installation

Cloner le dépôt puis se placer dans le dossier du projet :

```bash
git clone <URL_DU_DEPOT>
cd innovevents
```

Créer le fichier d'environnement à partir du modèle fourni :

```bash
cp infra/docker/.env.example infra/docker/.env
```

Sous Windows PowerShell :

```powershell
Copy-Item infra/docker/.env.example infra/docker/.env
```

Renseigner ensuite les variables nécessaires dans le fichier `.env`.

> Les secrets réels ne doivent jamais être ajoutés au dépôt Git.

## Démarrage avec Docker

Se placer dans le dossier contenant la configuration Docker :

```bash
cd infra/docker
```

Construire et démarrer les services :

```bash
docker compose up --build
```

Pour démarrer les services en arrière-plan :

```bash
docker compose up --build -d
```

## Services disponibles

| Service | Adresse locale |
|---|---|
| Application web | `http://localhost:5173` |
| API Django | `http://localhost:8000` |
| Administration Django | `http://localhost:8000/admin` |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |

## Arrêt de l'application

```bash
docker compose down
```

Pour supprimer également les volumes et réinitialiser les données locales :

```bash
docker compose down -v
```

> Cette dernière commande supprime les données enregistrées localement dans PostgreSQL et MongoDB.

## Commandes Docker utiles

Afficher l'état des services :

```bash
docker compose ps
```

Afficher les journaux :

```bash
docker compose logs -f
```

Afficher uniquement les journaux du backend :

```bash
docker compose logs -f backend
```

Exécuter les migrations Django :

```bash
docker compose exec backend python manage.py migrate
```

Créer un compte administrateur :

```bash
docker compose exec backend python manage.py createsuperuser
```

Vérifier la configuration Django :

```bash
docker compose exec backend python manage.py check
```

Exécuter les tests du backend :

```bash
docker compose exec backend python manage.py test
```

## Exécution locale sans Docker

### API Django

```bash
cd apps/back
python -m venv .venv
```

Activation de l'environnement virtuel sous Linux ou macOS :

```bash
source .venv/bin/activate
```

Activation sous Windows PowerShell :

```powershell
.venv\Scripts\Activate.ps1
```

Installation des dépendances et démarrage :

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Application web

```bash
cd apps/front
npm ci
npm run dev
```

### Application mobile

```bash
cd apps/mobile
npm ci
npm start
```

L'application mobile peut ensuite être ouverte avec Expo Go, un émulateur Android ou un simulateur iOS.

## Tests et qualité du code

### Backend

```bash
cd apps/back
python manage.py check
python manage.py test
```

### Frontend

```bash
cd apps/front
npm ci
npm run lint
npm run build
```

## Intégration continue

Le projet utilise GitHub Actions afin de vérifier automatiquement la qualité du code avant son intégration.

Le pipeline exécute notamment :

- l'installation des dépendances ;
- les vérifications Django ;
- les tests du backend ;
- l'analyse ESLint du frontend ;
- la compilation de l'application web.

Les workflows sont déclenchés lors des `push` et des `pull requests` sur les branches principales du projet.

## Variables d'environnement

Les paramètres propres à chaque environnement sont définis dans un fichier `.env`.

Exemples de variables utilisées :

```dotenv
DJANGO_SECRET_KEY=
DJANGO_DEBUG=
DJANGO_ALLOWED_HOSTS=

POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=
POSTGRES_PORT=

MONGO_DB=
MONGO_USER=
MONGO_PASSWORD=
MONGO_PORT=

CORS_ALLOWED_ORIGINS=
CSRF_TRUSTED_ORIGINS=
VITE_API_URL=

DJANGO_SUPERUSER_USERNAME=
DJANGO_SUPERUSER_EMAIL=
DJANGO_SUPERUSER_PASSWORD=
```

Un fichier `.env.example` doit présenter les variables attendues sans contenir de mot de passe ni de secret réel.

## Gestion des versions

Le projet utilise les branches principales suivantes :

- `main` : version stable destinée à la production ;
- `dev` : branche d'intégration et de développement.

Les modifications sont développées sur des branches dédiées, puis intégrées dans `dev` après validation. La branche `main` reçoit uniquement les versions testées et approuvées.

## Documentation

La documentation du projet est regroupée dans le dossier `docs/`.

Elle comprend notamment :

- l'architecture logicielle ;
- la conception de la base de données ;
- le MCD, le MLD et le MPD ;
- les scripts SQL de création et d'insertion ;
- la configuration Docker ;
- la stratégie Git ;
- le plan de tests ;
- les rapports de couverture ;
- la configuration de l'intégration continue ;
- la procédure de déploiement ;
- la documentation utilisateur.

## Sécurité

Les principales mesures mises en œuvre sont :

- authentification par jetons JWT ;
- contrôle des autorisations selon les rôles ;
- validation des données côté serveur ;
- stockage sécurisé des mots de passe avec Django ;
- utilisation de variables d'environnement pour les secrets ;
- restrictions CORS ;
- configuration des hôtes autorisés ;
- journalisation des actions sensibles ;
- séparation des données relationnelles et des journaux techniques.

Les secrets et identifiants de démonstration doivent être remplacés avant tout déploiement en production.

## Déploiement

La procédure de déploiement est détaillée dans la documentation technique du projet.

Le déploiement de la version de production doit être automatisé depuis la branche `main` après la réussite des contrôles réalisés par le pipeline d'intégration continue.

## Licence

Projet réalisé dans le cadre de l'évaluation du titre professionnel Concepteur développeur d'applications.
