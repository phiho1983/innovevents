# Innov'Events — Installation locale avec Docker

Ce dépôt contient le projet **Innov'Events** :

- backend Django et API REST ;
- frontend React ;
- application mobile ;
- PostgreSQL ;
- MongoDB ;
- configuration Docker ;
- documentation et livrables.

Cette procédure permet à un développeur ou à un examinateur de cloner le dépôt, de créer sa propre configuration locale et de démarrer l'application sans recevoir les mots de passe du développeur.

---

## 1. Prérequis

Installer :

- Git ;
- Docker Desktop ou Docker Engine ;
- Docker Compose.

Vérifier l'installation :

```bash
git --version
docker --version
docker compose version
```

Sous Windows, Docker Desktop doit être démarré.

---

## 2. Organisation du dépôt

```text
innovevents/
├── apps/
│   ├── back/              # Backend Django
│   ├── front/             # Frontend React
│   └── mobile/            # Application mobile
├── infra/
│   └── docker/
│       ├── docker-compose.yml
│       ├── .env.example
│       └── docker/
├── Docs/
├── .github/
│   └── workflows/
└── README.md
```

Les commandes Docker de ce document doivent être exécutées depuis :

```text
infra/docker/
```

---

## 3. Cloner le dépôt

### Windows PowerShell

```powershell
git clone https://github.com/phiho1983/innovevents.git
Set-Location innovevents
```

### Linux et macOS

```bash
git clone https://github.com/phiho1983/innovevents.git
cd innovevents
```

---

## 4. Gestion des secrets

Le vrai fichier `.env` n'est pas présent sur GitHub.

```text
.env          → fichier local privé, non versionné
.env.example  → modèle public, sans secret réel
```

L'examinateur crée son propre `.env` et choisit ses propres mots de passe.

Les mots de passe du développeur local et ceux de la version déployée ne sont pas communiqués.

---

## 5. Créer le fichier `.env`

Se placer dans le dossier Docker.

### Windows PowerShell

```powershell
Set-Location infra\docker
Copy-Item .env.example .env
notepad .env
```

### Linux et macOS

```bash
cd infra/docker
cp .env.example .env
nano .env
```

Exemple de configuration :

```dotenv
# Django
DJANGO_DEBUG=1
DJANGO_SECRET_KEY=change_me_with_a_long_random_value
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173

# PostgreSQL
POSTGRES_DB=innovevents
POSTGRES_USER=innovevents
POSTGRES_PASSWORD=change_me
POSTGRES_PORT=5432

# MongoDB
MONGO_DB=innovevents_logs
MONGO_USER=innovevents
MONGO_PASSWORD=change_me
MONGO_PORT=27017

# Services
BACKEND_PORT=8000
FRONTEND_PORT=5173
VITE_API_URL=http://localhost:8000

# Administrateur Django local
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=change_me
```

Toutes les valeurs `change_me` doivent être remplacées avant le premier démarrage.

---

## 6. Création automatique des bases et comptes techniques

Lors du premier démarrage avec des volumes Docker neufs, Docker utilise les variables du `.env`.

### PostgreSQL

Les variables suivantes créent automatiquement :

- la base PostgreSQL ;
- l'utilisateur PostgreSQL ;
- son mot de passe.

```dotenv
POSTGRES_DB=innovevents
POSTGRES_USER=innovevents
POSTGRES_PASSWORD=mot_de_passe_choisi
```

L'examinateur n'a pas besoin de créer manuellement le compte PostgreSQL.

### MongoDB

Les variables suivantes créent automatiquement :

- l'utilisateur MongoDB ;
- son mot de passe ;
- la base documentaire.

```dotenv
MONGO_DB=innovevents_logs
MONGO_USER=innovevents
MONGO_PASSWORD=mot_de_passe_choisi
```

L'examinateur n'a pas besoin de créer manuellement le compte MongoDB.

### Important : les volumes conservent les anciens identifiants

Les mots de passe du `.env` sont utilisés lors de la première initialisation.

Modifier ensuite une valeur dans `.env` ne change pas automatiquement le mot de passe déjà enregistré dans PostgreSQL ou MongoDB.

```text
Premier démarrage   → création des comptes dans les volumes
Démarrages suivants → réutilisation des comptes existants
```

Sur un clone neuf avec de nouveaux volumes, les valeurs choisies par l'examinateur sont utilisées normalement.

---

## 7. Compte administrateur Django

Le compte administrateur local est défini avec :

```dotenv
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=mot_de_passe_choisi
```

Au démarrage, le backend peut exécuter :

```bash
python manage.py migrate --noinput
python scripts/create_superuser.py
```

Le compte est créé uniquement s'il n'existe pas déjà.

Modifier uniquement `DJANGO_SUPERUSER_PASSWORD` dans `.env` ne modifie pas le mot de passe d'un compte déjà présent.

Pour changer le mot de passe :

```bash
docker compose exec backend python manage.py changepassword admin
```

Pour créer manuellement un autre administrateur :

```bash
docker compose exec backend python manage.py createsuperuser
```

L'examinateur choisit alors lui-même le nom, l'email et le mot de passe.

---

## 8. Comptes administrateur, employé et client

Le superutilisateur permet d'accéder à :

```text
http://localhost:8000/admin
```

Depuis Django Admin, l'examinateur peut créer les comptes nécessaires aux tests :

- administrateur ;
- employé ;
- client.

Aucun mot de passe personnel n'est publié dans le dépôt.

Les scripts présents dans `Docs/database/` servent à valider le modèle SQL et les données de démonstration. Ils ne remplacent pas les migrations Django ni la création normale des comptes de l'application.

---

## 9. Démarrer l'environnement

Depuis `infra/docker` :

```bash
docker compose up --build -d
```

Services démarrés :

| Service | Rôle |
|---|---|
| `frontend` | Application React |
| `backend` | API Django |
| `db` | PostgreSQL |
| `mongo` | MongoDB |

Vérifier leur état :

```bash
docker compose ps
```

Résultat attendu :

```text
backend    Up
frontend   Up
db         Up (healthy)
mongo      Up (healthy)
```

Afficher aussi les conteneurs arrêtés :

```bash
docker compose ps -a
```

---

## 10. Accès aux services

| Service | Adresse |
|---|---|
| Application web | `http://localhost:5173` |
| API Django | `http://localhost:8000` |
| Django Admin | `http://localhost:8000/admin` |
| PostgreSQL | `localhost:5432` |
| MongoDB | `localhost:27017` |

---

## 11. Première connexion de l'examinateur

1. Cloner le dépôt.
2. Copier `.env.example` vers `.env`.
3. Remplacer toutes les valeurs `change_me`.
4. Démarrer Docker.
5. Ouvrir `http://localhost:5173`.
6. Utiliser le compte défini dans `DJANGO_SUPERUSER_USERNAME`.
7. Utiliser le mot de passe choisi dans `DJANGO_SUPERUSER_PASSWORD`.

Vérifier les comptes Django existants :

```bash
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.values('username','email','is_staff','is_superuser','is_active')))"
```

Réinitialiser le mot de passe admin :

```bash
docker compose exec backend python manage.py changepassword admin
```

---

## 12. Persistance des données

Les données sont conservées dans des volumes Docker.

Les données restent présentes après :

```bash
docker compose down
```

Le volume PostgreSQL conserve notamment les comptes Django, événements, réservations, prospects, devis et migrations.

---

## 13. Arrêt et redémarrage

Arrêter sans supprimer les données :

```bash
docker compose down
```

Redémarrer :

```bash
docker compose up -d
```

---

## 14. Réinitialisation complète

Pour supprimer les volumes et recréer l'environnement :

```bash
docker compose down -v
docker compose up --build -d
```

Attention : cette opération supprime définitivement toutes les données locales PostgreSQL et MongoDB.

Au redémarrage, les comptes techniques et le compte administrateur sont recréés à partir du `.env` actuel.

---

## 15. Changer les mots de passe après initialisation

### Django

```bash
docker compose exec backend python manage.py changepassword admin
```

### PostgreSQL

Une erreur telle que :

```text
password authentication failed for user "innovevents"
```

indique souvent que le `.env` ne correspond plus au mot de passe enregistré dans le volume.

Pour aligner PostgreSQL avec le `.env` :

```bash
docker compose exec db psql -U innovevents -d innovevents -c "ALTER USER innovevents WITH PASSWORD 'nouveau_mot_de_passe';"
```

La valeur doit être identique à :

```dotenv
POSTGRES_PASSWORD=nouveau_mot_de_passe
```

Cette commande ne supprime pas les tables ni les données.

### MongoDB

Modifier `MONGO_PASSWORD` dans `.env` ne met pas à jour un utilisateur MongoDB déjà stocké.

En local, lorsqu'aucune donnée ne doit être conservée :

```bash
docker compose down -v
docker compose up --build -d
```

---

## 16. Commandes utiles

### Journaux

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
docker compose logs -f mongo
```

### Django

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py makemigrations --check --dry-run
docker compose exec backend python manage.py test --verbosity=2
docker compose exec backend python manage.py createsuperuser
docker compose exec backend python manage.py changepassword admin
```

### Couverture backend

```bash
docker compose exec backend coverage erase
docker compose exec backend coverage run --source=. manage.py test --verbosity=1
docker compose exec backend coverage report -m
```

### PostgreSQL

```bash
docker compose exec db psql -U innovevents -d innovevents
```

Dans `psql` :

```sql
\dt
\q
```

### MongoDB

```bash
docker compose exec mongo mongosh --username innovevents --password mot_de_passe_du_env --authenticationDatabase admin
```

Puis :

```javascript
use innovevents_logs
show collections
exit
```

---

## 17. Vérification du fonctionnement

```bash
docker compose ps
docker compose exec backend python manage.py check
```

Tester l'API :

```bash
curl http://localhost:8000
```

Sous PowerShell :

```powershell
Invoke-WebRequest http://localhost:8000
```

Ouvrir ensuite :

```text
http://localhost:5173
```

---

## 18. Résolution des problèmes courants

### Backend arrêté

```bash
docker compose ps -a
docker compose logs --tail=150 backend
```

### Erreur PostgreSQL

Vérifier que `POSTGRES_PASSWORD` correspond au mot de passe conservé dans le volume.

### Tables déjà présentes

Un script de création SQL doit être exécuté sur une base vide.

### Accents incorrects sous PowerShell

Copier le script dans le conteneur :

```powershell
docker compose cp chemin\script.sql db:/tmp/script.sql
```

Puis :

```powershell
docker compose exec db psql -U innovevents -d nom_base -f /tmp/script.sql
```

### Frontend sans accès à l'API

Vérifier :

```dotenv
VITE_API_URL=http://localhost:8000
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Port déjà utilisé

Modifier les ports dans `.env`.

---

## 19. Application mobile

L'application mobile est située dans :

```text
apps/mobile/
```

Elle n'est pas démarrée par le Docker Compose web présenté ici.

Consulter la documentation du dossier mobile pour installer ses dépendances, configurer l'URL de l'API et lancer l'application.

---

## 20. Sécurité

- Ne jamais versionner `.env`.
- Ne jamais publier un vrai mot de passe.
- Conserver uniquement `.env.example` dans Git.
- Remplacer toutes les valeurs `change_me`.
- Utiliser une clé Django longue et aléatoire.
- Ne pas afficher les mots de passe dans les captures.
- Ne pas réutiliser les identifiants Render en local.
- Ne pas exposer PostgreSQL ou MongoDB publiquement.

La version locale et la version Render utilisent des bases et des comptes distincts.

```text
Docker local → base locale et mots de passe locaux
Render       → base distante et mots de passe distants
```

---

## 21. Vérifier que `.env` est ignoré

Depuis la racine :

```bash
git status
git check-ignore infra/docker/.env
```

Résultat attendu :

```text
infra/docker/.env
```

---

## 22. Procédure résumée pour l'examinateur

### Windows PowerShell

```powershell
git clone https://github.com/phiho1983/innovevents.git
Set-Location innovevents\infra\docker
Copy-Item .env.example .env
notepad .env
docker compose up --build -d
docker compose ps
```

### Linux et macOS

```bash
git clone https://github.com/phiho1983/innovevents.git
cd innovevents/infra/docker
cp .env.example .env
nano .env
docker compose up --build -d
docker compose ps
```

L'examinateur choisit ses propres mots de passe, démarre les services et utilise le compte administrateur défini dans son `.env`.

---

## Conclusion

Une installation neuve ne nécessite pas les identifiants personnels du développeur.

L'examinateur :

- crée son propre `.env` ;
- choisit ses propres mots de passe ;
- démarre Docker ;
- obtient automatiquement PostgreSQL et MongoDB ;
- crée ou utilise son propre administrateur Django ;
- crée ensuite les comptes fonctionnels nécessaires aux tests.