# Innov'Events — Architecture technique

Ce document présente l’architecture technique actuelle du projet **Innov'Events**.

L’application repose sur plusieurs composants complémentaires :

- une application web React ;
- une API Django REST ;
- une application mobile React Native avec Expo ;
- une base PostgreSQL ;
- une base MongoDB ;
- une authentification JWT ;
- un environnement Docker local ;
- une intégration continue GitHub Actions ;
- un déploiement distinct de l’environnement local.

---

## 1. Vue d’ensemble

```text
Utilisateur web
      |
      v
Frontend React / Vite
      |
      | Requêtes HTTP / JSON
      v
API Django REST
      |
      +-------------------+
      |                   |
      v                   v
PostgreSQL             MongoDB
Données métier         Journaux / données documentaires

Application mobile React Native / Expo
      |
      | Requêtes HTTP / JSON
      v
API Django REST
```

Le frontend web et l’application mobile consomment la même API Django.

PostgreSQL stocke les données métier structurées.

MongoDB est prévu pour les journaux et les données documentaires.

---

## 2. Organisation générale du projet

```text
innovevents/
├── apps/
│   ├── back/              # Backend Django
│   ├── front/             # Frontend React
│   └── mobile/            # Application React Native / Expo
├── infra/
│   └── docker/            # Docker Compose et Dockerfiles
├── Docs/                  # Documentation et livrables
├── .github/
│   └── workflows/         # Intégration continue
└── README.md
```

---

## 3. Frontend web

Le frontend utilise :

- React 19 ;
- Vite ;
- React Router ;
- Three.js ;
- React Three Fiber ;
- GSAP ;
- ESLint.

Commandes principales :

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

### Routes publiques

| Route | Page |
|---|---|
| `/` | Accueil |
| `/demande-de-devis` | Demande de devis |
| `/login` | Connexion |
| `/signup` | Inscription |
| `/evenements` | Événements |
| `/contact` | Contact |
| `/avis` | Avis |
| `/mentions-legales` | Mentions légales |

### Routes protégées

| Route | Protection |
|---|---|
| `/admin` | `StaffOnlyRoute` |
| `/client` | `ClientOnlyRoute` |

Les routes protégées contrôlent le rôle de l’utilisateur avant d’afficher la page.

### Limites actuelles

Les pages suivantes existent dans le code mais ne sont pas encore reliées dans `App.jsx` :

- page employé ;
- page mot de passe oublié.

La création d’événement depuis le frontend est également en cours de finalisation.

---

## 4. Backend Django

Le backend utilise :

- Django ;
- Django REST Framework ;
- Simple JWT ;
- PostgreSQL ;
- `dj-database-url` ;
- WhiteNoise ;
- CORS Headers ;
- Django Extensions.

Le backend est organisé en plusieurs applications métier :

```text
accounts
crm
events
bookings
reviews
```

### Responsabilités

| Application | Responsabilité |
|---|---|
| `accounts` | Utilisateurs, rôles et authentification |
| `crm` | Prospects, clients, devis et notes |
| `events` | Événements |
| `bookings` | Réservations |
| `reviews` | Avis |

---

## 5. Authentification et rôles

Le projet utilise un modèle utilisateur personnalisé :

```text
accounts.User
```

Il hérite de `AbstractUser`.

### Rôles disponibles

```text
ADMIN
EMPLOYEE
CLIENT
```

Chaque utilisateur possède également :

```text
must_change_password
```

Ce champ permet d’imposer un changement de mot de passe selon le contexte.

### Authentification JWT

L’API utilise JSON Web Token avec :

- une route de connexion ;
- une route de rafraîchissement ;
- une durée de vie de 30 minutes pour le jeton d’accès.

Routes principales :

```text
/api/login/
/api/token/refresh/
/api/me/
/api/signup/
/api/forgot-password/
/api/change-password/
```

La permission par défaut de l’API est :

```text
IsAuthenticated
```

Les vues publiques doivent donc déclarer explicitement des permissions plus ouvertes.

---

## 6. API principale

Routes confirmées :

| Route | Fonction |
|---|---|
| `/admin/` | Administration Django |
| `/api/health/` | Vérification de disponibilité |
| `/api/` | Routes métier |
| `/api/login/` | Connexion JWT |
| `/api/token/refresh/` | Rafraîchissement du jeton |
| `/api/me/` | Informations utilisateur |
| `/api/public-config/` | Configuration publique |
| `/api/signup/` | Inscription |
| `/api/forgot-password/` | Demande de réinitialisation |
| `/api/change-password/` | Changement de mot de passe |

### Format d’échange

Les échanges entre les clients et l’API sont réalisés en HTTP avec des données JSON.

Exemple :

```text
Frontend React
→ POST /api/login/
→ jeton JWT
→ appels API authentifiés
```

---

## 7. Modèle de données

### Utilisateur

```text
User
```

Champs principaux :

- identifiant Django ;
- nom d’utilisateur ;
- email ;
- mot de passe chiffré ;
- rôle ;
- obligation éventuelle de changer le mot de passe.

### Prospect

```text
Prospect
```

Champs principaux :

- prénom ;
- nom ;
- email ;
- téléphone ;
- entreprise ;
- ville ;
- message ;
- type d’événement ;
- date souhaitée ;
- nombre de participants ;
- statut ;
- date de création.

Statuts :

```text
TO_CONTACT
CONTACTED
QUALIFIED
ARCHIVED
```

### Profil client

```text
ClientProfile
```

Relation :

```text
User 1 — 1 ClientProfile
```

Champs :

- entreprise ;
- téléphone ;
- adresse.

### Devis

```text
Quote
```

Un devis peut être associé :

- à un client ;
- à un prospect.

Statuts :

```text
DRAFT
SENT
ACCEPTED
REFUSED
CHANGE_REQUESTED
```

Les totaux sont calculés avec :

- total hors taxes ;
- TVA ;
- total toutes taxes comprises.

### Ligne de devis

```text
QuoteItem
```

Relation :

```text
Quote 1 — N QuoteItem
```

Champs :

- libellé ;
- montant hors taxes.

### Note

```text
Note
```

Une note contient :

- un auteur ;
- éventuellement un client ;
- un contenu ;
- un indicateur d’épinglage ;
- une date de création.

### Événement

```text
Event
```

Champs principaux :

- titre ;
- description ;
- ville ;
- date de début ;
- date de fin ;
- capacité ;
- type ;
- thème ;
- image ;
- statut ;
- visibilité ;
- accord du client ;
- organisateur ;
- client ;
- date de création.

Statuts :

```text
DRAFT
ACCEPTED
IN_PROGRESS
DONE
CANCELLED
```

Types :

```text
SEMINAR
CONFERENCE
PARTY
OTHER
```

Un événement est public lorsque :

```text
client_agreed = True
status != DRAFT
visible = True
```

### Réservation

```text
Booking
```

Relation :

```text
User N — 1 Booking N — 1 Event
```

Champs :

- utilisateur ;
- événement ;
- quantité ;
- statut ;
- date de création.

Statuts :

```text
PENDING
CONFIRMED
CANCELLED
```

### Avis

```text
Review
```

Champs :

- auteur ;
- note de 1 à 5 ;
- contenu ;
- date de création.

Les avis sont classés du plus récent au plus ancien.

---

## 8. PostgreSQL

PostgreSQL est la base relationnelle principale.

Elle stocke notamment :

- les utilisateurs ;
- les prospects ;
- les profils clients ;
- les devis ;
- les lignes de devis ;
- les notes ;
- les événements ;
- les réservations ;
- les avis ;
- les migrations Django.

En local, la base est fournie par :

```text
postgres:16
```

Les données sont persistées dans un volume Docker :

```text
innovevents_pgdata
```

---

## 9. MongoDB

MongoDB est prévu pour :

- les journaux d’activité ;
- les données techniques ;
- les données documentaires.

En local, MongoDB utilise :

```text
mongo:7
```

Les données sont persistées dans :

```text
innovevents_mongodata
```

Le backend reçoit :

```text
MONGO_URL
MONGO_DB
```

L’intégration métier détaillée de MongoDB reste à compléter si toutes les fonctions de journalisation ne sont pas encore développées.

---

## 10. Application mobile

L’application mobile utilise :

- React Native ;
- Expo ;
- React Navigation ;
- Async Storage.

Écrans confirmés :

| Écran | Fonction |
|---|---|
| `Login` | Connexion |
| `Events` | Liste des événements |
| `EventDetail` | Détail d’un événement |
| `Client` | Fiche client |

Navigation :

```text
Login
→ Events
→ EventDetail
→ Client
```

Commandes disponibles :

```bash
npm start
npm run android
npm run ios
npm run web
```

L’application mobile n’est pas démarrée par le Docker Compose principal.

---

## 11. Docker local

Docker Compose orchestre quatre services :

```text
db
mongo
backend
frontend
```

### Dépendances

```text
PostgreSQL ─┐
            ├─> Backend ─> Frontend
MongoDB ────┘
```

Le backend démarre uniquement lorsque PostgreSQL et MongoDB sont considérés comme sains.

### Backend

Au démarrage :

```text
python manage.py migrate --noinput
python scripts/create_superuser.py
python manage.py runserver 0.0.0.0:8000
```

### Frontend

Au démarrage :

```text
npm ci
npm run dev -- --host 0.0.0.0 --port 5173
```

### Ports par défaut

| Service | Port |
|---|---|
| Frontend | 5173 |
| Backend | 8000 |
| PostgreSQL | 5432 |
| MongoDB | 27017 |

---

## 12. Variables d’environnement

Les principales variables sont :

### Django

```text
DJANGO_DEBUG
DJANGO_SECRET_KEY
DJANGO_ALLOWED_HOSTS
CORS_ALLOWED_ORIGINS
CSRF_TRUSTED_ORIGINS
```

### PostgreSQL

```text
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
```

### MongoDB

```text
MONGO_DB
MONGO_USER
MONGO_PASSWORD
MONGO_PORT
```

### Services

```text
BACKEND_PORT
FRONTEND_PORT
VITE_API_URL
```

### Administrateur Django

```text
DJANGO_SUPERUSER_USERNAME
DJANGO_SUPERUSER_EMAIL
DJANGO_SUPERUSER_PASSWORD
```

Le vrai fichier `.env` ne doit pas être versionné.

---

## 13. Sécurité

Mesures confirmées :

- mots de passe gérés par Django ;
- validation des mots de passe ;
- authentification JWT ;
- limitation de durée du jeton d’accès ;
- CORS configurable ;
- CSRF configurable ;
- hôtes autorisés configurables ;
- en-tête proxy HTTPS ;
- routes protégées selon les rôles ;
- `.env` non versionné ;
- SSL configurable pour la base distante ;
- WhiteNoise pour les fichiers statiques.

Points à surveiller :

- ne pas conserver les valeurs par défaut en production ;
- ne pas publier les mots de passe Docker ;
- ne pas exposer PostgreSQL et MongoDB ;
- utiliser HTTPS en production ;
- limiter les permissions des comptes ;
- vérifier les routes publiques de l’API ;
- ne pas stocker les jetons de manière non sécurisée.

---

## 14. Intégration continue

Le projet utilise GitHub Actions pour contrôler automatiquement le code.

### Backend

Contrôles réalisés :

- installation des dépendances ;
- migrations ;
- tests Django ;
- couverture ;
- seuil minimal de couverture.

Résultat actuel :

```text
6 tests réussis
68 % de couverture
seuil minimal : 60 %
```

### Frontend

Contrôles réalisés :

```text
npm ci
npm run lint
npm run build
```

Ces contrôles vérifient :

- l’installation reproductible ;
- la qualité du code ;
- la compilation.

---

## 15. Déploiement

L’environnement local repose sur Docker.

La version distante utilise une configuration distincte avec :

- variables d’environnement propres ;
- base distante ;
- mots de passe distincts ;
- SSL de base de données activable ;
- fichiers statiques servis avec WhiteNoise.

La version locale et la version déployée ne partagent pas les mêmes identifiants.

```text
Local Docker → comptes et bases locales
Déploiement  → comptes et bases distants
```

---

## 16. Flux fonctionnels principaux

### Connexion

```text
Utilisateur
→ formulaire React
→ POST /api/login/
→ génération JWT
→ stockage côté client
→ appels API authentifiés
```

### Demande de devis

```text
Visiteur
→ formulaire public
→ API CRM
→ création d’un Prospect
→ traitement dans Django Admin
→ création éventuelle d’un devis
```

### Gestion d’un événement

```text
Administrateur ou employé
→ Django Admin ou future interface frontend
→ création de l’événement
→ stockage PostgreSQL
→ affichage si événement public
```

### Réservation

```text
Client
→ sélection d’un événement
→ création d’une réservation
→ statut PENDING
→ validation éventuelle
```

### Avis

```text
Utilisateur connecté
→ saisie d’un avis
→ validation de la note
→ stockage PostgreSQL
→ affichage du plus récent au plus ancien
```

---

## 17. Limites et éléments en cours

Les éléments suivants sont encore à finaliser ou à valider complètement :

- création d’événement depuis le frontend ;
- espace employé accessible par une route ;
- page mot de passe oublié accessible par une route ;
- parcours complet de réservation ;
- gestion complète des devis depuis le frontend ;
- intégration complète de MongoDB ;
- couverture de tests frontend ;
- tests mobiles ;
- tests end-to-end automatisés.

---

## 18. Synthèse

| Composant | Technologie | Rôle |
|---|---|---|
| Frontend web | React / Vite | Interface navigateur |
| Backend | Django REST | API et logique métier |
| Mobile | React Native / Expo | Application mobile |
| Base principale | PostgreSQL | Données relationnelles |
| Base documentaire | MongoDB | Journaux et documents |
| Authentification | JWT | Sécurisation des API |
| Local | Docker Compose | Orchestration |
| CI | GitHub Actions | Tests et qualité |
| Déploiement | Environnement distant | Mise en ligne |

---

## Conclusion

L’architecture Innov'Events sépare clairement :

- les interfaces clientes ;
- l’API métier ;
- les données relationnelles ;
- les données documentaires ;
- l’environnement local ;
- la validation continue ;
- le déploiement.

Cette organisation permet de faire évoluer indépendamment le frontend, le backend et l’application mobile tout en conservant une API centrale commune.