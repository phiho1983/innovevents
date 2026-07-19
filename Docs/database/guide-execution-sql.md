# Guide d’exécution des scripts SQL — Innov’Events

## 1. Objet

Les scripts SQL du dossier `Docs/database` constituent des livrables documentaires et pédagogiques.

Ils permettent de présenter une création manuelle du schéma métier PostgreSQL d’Innov’Events, indépendamment des migrations Django.

Dans l’application réelle, la structure de la base est gérée par Django avec :

```bash
python manage.py makemigrations
python manage.py migrate
```

Les scripts SQL manuels doivent être exécutés uniquement sur une base PostgreSQL vide de démonstration.

---

## 2. Arborescence des livrables

```text
Docs/
└── database/
    ├── README.md
    ├── mcd.md
    ├── mcd.drawio
    ├── mcd.pdf
    ├── mld.md
    ├── mpd.md
    ├── dictionnaire-donnees.md
    ├── 01_create_schema.sql
    ├── 02_insert_demo_data.sql
    └── 03_drop_schema.sql
```

---

## 3. Prérequis

Les éléments suivants doivent être installés :

- PostgreSQL ;
- le client en ligne de commande `psql` ;
- un utilisateur PostgreSQL autorisé à créer une base ;
- un terminal PowerShell, Bash ou équivalent.

Vérifier que PostgreSQL est disponible :

```bash
psql --version
```

Exemple de résultat :

```text
psql (PostgreSQL) 16.x
```

---

## 4. Se placer à la racine du projet

### PowerShell

```powershell
Set-Location "C:\CHEMIN\VERS\innovevents"
```

### Linux ou macOS

```bash
cd /chemin/vers/innovevents
```

Vérifier la présence des scripts :

### PowerShell

```powershell
Get-ChildItem "Docs/database"
```

### Linux ou macOS

```bash
ls -la Docs/database
```

---

## 5. Créer une base de démonstration

Le nom recommandé est :

```text
innovevents_demo
```

### Méthode 1 — Avec `createdb`

```bash
createdb -U postgres innovevents_demo
```

### Méthode 2 — Avec `psql`

```bash
psql -U postgres
```

Puis, dans la console PostgreSQL :

```sql
CREATE DATABASE innovevents_demo;
```

Quitter la console :

```text
\q
```

---

## 6. Vérifier la connexion

```bash
psql -U postgres -d innovevents_demo
```

Dans PostgreSQL, afficher la base courante :

```sql
SELECT current_database();
```

Résultat attendu :

```text
innovevents_demo
```

Quitter :

```text
\q
```

---

## 7. Exécuter le script de création

Script concerné :

```text
Docs/database/01_create_schema.sql
```

### PowerShell

```powershell
psql `
  -U postgres `
  -d innovevents_demo `
  -v ON_ERROR_STOP=1 `
  -f "Docs/database/01_create_schema.sql"
```

### Linux ou macOS

```bash
psql   -U postgres   -d innovevents_demo   -v ON_ERROR_STOP=1   -f "Docs/database/01_create_schema.sql"
```

### Rôle de l’option `ON_ERROR_STOP`

```text
-v ON_ERROR_STOP=1
```

Cette option arrête immédiatement l’exécution lorsqu’une erreur SQL est rencontrée.

Elle évite de continuer avec un schéma partiellement créé.

---

## 8. Vérifier les tables créées

Se connecter à la base :

```bash
psql -U postgres -d innovevents_demo
```

Afficher les tables :

```text
\dt
```

Tables métier attendues :

```text
accounts_user
bookings_booking
crm_clientprofile
crm_note
crm_prospect
crm_quote
crm_quoteitem
events_event
reviews_review
```

Afficher la structure d’une table :

```text
\d accounts_user
```

```text
\d events_event
```

```text
\d crm_quote
```

Afficher toutes les contraintes d’une table :

```text
\d+ crm_quote
```

Quitter :

```text
\q
```

---

## 9. Vérifications SQL complémentaires

### Compter les tables métier

```sql
SELECT COUNT(*)
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';
```

### Afficher les clés étrangères

```sql
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS referenced_table,
    ccu.column_name AS referenced_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
```

### Afficher les index

```sql
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

---

## 10. Insérer les données de démonstration

Script concerné :

```text
Docs/database/02_insert_demo_data.sql
```

Ce script doit être exécuté après `01_create_schema.sql`.

### PowerShell

```powershell
psql `
  -U postgres `
  -d innovevents_demo `
  -v ON_ERROR_STOP=1 `
  -f "Docs/database/02_insert_demo_data.sql"
```

### Linux ou macOS

```bash
psql   -U postgres   -d innovevents_demo   -v ON_ERROR_STOP=1   -f "Docs/database/02_insert_demo_data.sql"
```

### Vérifier les données

```bash
psql -U postgres -d innovevents_demo
```

Exemples :

```sql
SELECT id, username, email, role
FROM accounts_user
ORDER BY id;
```

```sql
SELECT id, title, city, start_at, status
FROM events_event
ORDER BY id;
```

```sql
SELECT id, client_id, prospect_id, status, tva_rate
FROM crm_quote
ORDER BY id;
```

```sql
SELECT id, quote_id, label, amount_ht
FROM crm_quoteitem
ORDER BY quote_id, id;
```

Quitter :

```text
\q
```

---

## 11. Supprimer le schéma métier

Script concerné :

```text
Docs/database/03_drop_schema.sql
```

Ce script supprime les tables métier dans l’ordre inverse de leurs dépendances.

### PowerShell

```powershell
psql `
  -U postgres `
  -d innovevents_demo `
  -v ON_ERROR_STOP=1 `
  -f "Docs/database/03_drop_schema.sql"
```

### Linux ou macOS

```bash
psql   -U postgres   -d innovevents_demo   -v ON_ERROR_STOP=1   -f "Docs/database/03_drop_schema.sql"
```

Vérifier ensuite :

```bash
psql -U postgres -d innovevents_demo -c "\dt"
```

Résultat attendu :

```text
Did not find any relations.
```

---

## 12. Supprimer complètement la base de démonstration

La base ne doit pas être utilisée par une connexion active.

### Méthode 1 — Avec `dropdb`

```bash
dropdb -U postgres innovevents_demo
```

### Méthode 2 — Avec `psql`

```bash
psql -U postgres -d postgres
```

Puis :

```sql
DROP DATABASE innovevents_demo;
```

Quitter :

```text
\q
```

---

## 13. Ordre d’exécution complet

```text
1. Créer la base innovevents_demo
2. Exécuter 01_create_schema.sql
3. Vérifier les tables et contraintes
4. Exécuter 02_insert_demo_data.sql
5. Vérifier les données de démonstration
6. Exécuter 03_drop_schema.sql
7. Supprimer éventuellement la base innovevents_demo
```

Commande synthétique sous PowerShell :

```powershell
createdb -U postgres innovevents_demo

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1 `
  -f "Docs/database/01_create_schema.sql"

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1 `
  -f "Docs/database/02_insert_demo_data.sql"

psql -U postgres -d innovevents_demo -c "\dt"

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1 `
  -f "Docs/database/03_drop_schema.sql"

dropdb -U postgres innovevents_demo
```

Commande synthétique sous Linux ou macOS :

```bash
createdb -U postgres innovevents_demo

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1   -f "Docs/database/01_create_schema.sql"

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1   -f "Docs/database/02_insert_demo_data.sql"

psql -U postgres -d innovevents_demo -c "\dt"

psql -U postgres -d innovevents_demo -v ON_ERROR_STOP=1   -f "Docs/database/03_drop_schema.sql"

dropdb -U postgres innovevents_demo
```

---

## 14. Exécution depuis la console `psql`

Il est également possible de lancer les scripts après connexion :

```bash
psql -U postgres -d innovevents_demo
```

Puis :

```text
\i Docs/database/01_create_schema.sql
\i Docs/database/02_insert_demo_data.sql
\i Docs/database/03_drop_schema.sql
```

Sous Windows, utiliser éventuellement un chemin absolu :

```text
\i C:/chemin/vers/innovevents/Docs/database/01_create_schema.sql
```

---

## 15. Variables d’environnement

Pour éviter de répéter certains paramètres :

### PowerShell

```powershell
$env:PGHOST = "localhost"
$env:PGPORT = "5432"
$env:PGUSER = "postgres"
$env:PGDATABASE = "innovevents_demo"
```

Puis :

```powershell
psql -v ON_ERROR_STOP=1 -f "Docs/database/01_create_schema.sql"
```

### Linux ou macOS

```bash
export PGHOST=localhost
export PGPORT=5432
export PGUSER=postgres
export PGDATABASE=innovevents_demo
```

Puis :

```bash
psql -v ON_ERROR_STOP=1 -f Docs/database/01_create_schema.sql
```

---

## 16. Authentification PostgreSQL

Lorsque PostgreSQL demande un mot de passe :

```text
Password for user postgres:
```

Saisir le mot de passe du compte PostgreSQL.

Il est déconseillé d’écrire un mot de passe directement dans une commande ou dans un fichier versionné.

Le fichier `.pgpass` peut être utilisé dans un environnement local sécurisé.

---

## 17. Erreurs courantes

### `psql` n’est pas reconnu

Exemple :

```text
psql : Le terme « psql » n’est pas reconnu
```

Ajouter le dossier `bin` de PostgreSQL à la variable `PATH`.

Exemple Windows :

```text
C:\Program Files\PostgreSQL\16\bin
```

### La base existe déjà

```text
database "innovevents_demo" already exists
```

Supprimer la base existante ou utiliser un autre nom :

```bash
dropdb -U postgres innovevents_demo
createdb -U postgres innovevents_demo
```

### Une table existe déjà

```text
relation "accounts_user" already exists
```

Le script a été exécuté sur une base non vide.

Utiliser une nouvelle base de démonstration ou exécuter le script de suppression.

### Échec de connexion

```text
connection refused
```

Vérifier :

- que le service PostgreSQL est démarré ;
- le port, généralement `5432` ;
- le nom d’hôte ;
- les paramètres d’authentification.

### Erreur de clé étrangère

```text
violates foreign key constraint
```

Vérifier que les données parentes sont insérées avant les données enfants.

Exemple :

```text
accounts_user avant crm_clientprofile
events_event avant bookings_booking
crm_quote avant crm_quoteitem
```

### Erreur de contrainte CHECK

```text
violates check constraint
```

Vérifier notamment :

- les rôles utilisateurs ;
- les statuts ;
- les quantités ;
- la capacité ;
- les dates d’événement ;
- le destinataire du devis ;
- la note d’un avis.

---

## 18. Séparation avec les migrations Django

Les deux méthodes ne doivent pas être utilisées simultanément sur la même base.

### Fonctionnement normal de l’application

```bash
python manage.py makemigrations
python manage.py migrate
```

### Démonstration SQL manuelle

```bash
psql -U postgres -d innovevents_demo   -f Docs/database/01_create_schema.sql
```

Le script manuel sert à démontrer la maîtrise de PostgreSQL et de la conception relationnelle.

Les migrations Django restent la source opérationnelle utilisée par l’application.