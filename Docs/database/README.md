## Utilisation des scripts SQL

Les scripts SQL présents dans ce dossier constituent des livrables
documentaires et pédagogiques.

Dans l’application Innov’Events, la création et l’évolution du schéma sont
gérées par les migrations Django.

Le script `01_create_schema.sql` permet de présenter une implémentation
manuelle équivalente du schéma métier PostgreSQL. Il doit être exécuté
uniquement sur une base de démonstration vide et ne doit pas être appliqué
sur une base déjà initialisée par Django.

# Validation des scripts SQL

## 1. Objectif

Ce document présente les tests réalisés sur les scripts SQL de la base de données PostgreSQL.

Les vérifications permettent de confirmer que :

- le schéma peut être créé sur une base vide ;
- les tables, contraintes et index sont correctement générés ;
- les données de démonstration peuvent être insérées ;
- les séquences PostgreSQL sont correctement mises à jour ;
- les caractères accentués sont correctement conservés ;
- les données insérées peuvent être consultées ;
- le script de suppression peut nettoyer la base de démonstration.

---

## 2. Environnement de test

Les tests ont été réalisés avec :

- Docker ;
- Docker Compose ;
- PostgreSQL 16 ;
- le client `psql` ;
- PowerShell ;
- une base de démonstration séparée de la base principale.

Nom de la base de test :

```text
innovevents_demo
```

Cette base est uniquement utilisée pour tester les scripts SQL sans modifier les données principales de l'application.

---

## 3. Scripts concernés

| Fichier | Utilité | Résultat |
|---|---|---|
| `01_create_schema.sql` | Création des tables, contraintes et index | Validé |
| `02_insert_demo_data.sql` | Insertion des données de démonstration | Validé |
| `03_drop_schema.sql` | Suppression du schéma de démonstration | À valider |

---

## 4. Création de la base de démonstration

Commande utilisée :

```powershell
docker compose exec db psql -U innovevents -d postgres -c "CREATE DATABASE innovevents_demo;"
```

Résultat obtenu :

```text
CREATE DATABASE
```

---

## 5. Copie des scripts dans le conteneur PostgreSQL

Les fichiers SQL ont été copiés directement dans le conteneur PostgreSQL pour éviter les problèmes d'encodage avec PowerShell.

```powershell
docker compose cp ..\..\Docs\database\01_create_schema.sql db:/tmp/01_create_schema.sql
docker compose cp ..\..\Docs\database\02_insert_demo_data.sql db:/tmp/02_insert_demo_data.sql
```

Les copies temporaires sont placées dans :

```text
/tmp/
```

Les fichiers d'origine restent dans :

```text
Docs/database/
```

---

## 6. Test du script de création

Commande utilisée :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -f /tmp/01_create_schema.sql
```

Le script a exécuté avec succès :

- le début de la transaction avec `BEGIN` ;
- la création des tables ;
- la création des contraintes ;
- la création des index ;
- l'ajout des commentaires ;
- la validation avec `COMMIT`.

Exemple de résultat :

```text
BEGIN
CREATE TABLE
COMMENT
CREATE INDEX
COMMIT
```

### Capture du test de création

![Exécution réussie du script de création](../captures/database/sql-creation-success.png)

---

## 7. Test du script d'insertion

Commande utilisée :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -f /tmp/02_insert_demo_data.sql
```

Le script a correctement exécuté :

- les instructions `INSERT` ;
- la mise à jour des séquences avec `setval` ;
- les requêtes de contrôle ;
- la validation de la transaction avec `COMMIT`.

Exemple de résultat :

```text
BEGIN
INSERT 0 3
INSERT 0 1
setval
COMMIT
```

### Capture du test d'insertion

![Exécution réussie du script d'insertion](../captures/database/sql-insert-success.png)

---

## 8. Vérification des tables

Commande utilisée :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -c "\dt"
```

Cette commande permet d'afficher la liste des tables créées dans la base `innovevents_demo`.

### Capture de la liste des tables

![Liste des tables PostgreSQL](../captures/database/sql-tables-list.png)

---

## 9. Vérification des données insérées

### Vérification des utilisateurs

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -c "SELECT id, username, email, role FROM accounts_user;"
```

### Vérification des événements

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -c "SELECT id, title, city, status FROM events_event;"
```

Les résultats confirment que les données de démonstration sont présentes dans la base.

### Capture des données insérées

![Données de démonstration présentes dans PostgreSQL](../captures/database/sql-demo-data.png)

---

## 10. Correction du problème d'encodage

Une première exécution avec la commande suivante avait provoqué un mauvais affichage des caractères accentués :

```powershell
Get-Content ..\..\Docs\database\02_insert_demo_data.sql -Raw |
docker compose exec -T db psql -U innovevents -d innovevents_demo
```

Exemple du mauvais affichage :

```text
Conf??rence Transformation Num??rique
```

Le problème venait du passage du contenu dans le pipeline PowerShell.

La solution utilisée a été de copier directement le fichier dans le conteneur :

```powershell
docker compose cp ..\..\Docs\database\02_insert_demo_data.sql db:/tmp/02_insert_demo_data.sql
```

Puis de demander à PostgreSQL de lire le fichier avec l'option `-f` :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -f /tmp/02_insert_demo_data.sql
```

Résultat correct :

```text
Conférence Transformation Numérique
```

Aucun contenu SQL n'a été modifié. Seule la méthode d'exécution a changé.

---

## 11. Test du script de suppression

Copie du script dans le conteneur :

```powershell
docker compose cp ..\..\Docs\database\03_drop_schema.sql db:/tmp/03_drop_schema.sql
```

Exécution :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -f /tmp/03_drop_schema.sql
```

Vérification de la suppression des tables :

```powershell
docker compose exec db psql -U innovevents -d innovevents_demo -c "\dt"
```

Résultat attendu :

```text
Did not find any relations.
```

### Capture du test de suppression

Après le test, enregistrer la capture sous :

```text
Docs/captures/database/sql-drop-success.png
```

Puis ajouter ou conserver la ligne suivante :

```md
![Suppression réussie du schéma](../captures/database/sql-drop-success.png)
```

---

## 12. Organisation des captures

Les captures utilisées dans ce document doivent être placées dans :

```text
Docs/
├── database/
│   └── validation-scripts-sql.md
└── captures/
    └── database/
        ├── sql-creation-success.png
        ├── sql-insert-success.png
        ├── sql-tables-list.png
        ├── sql-demo-data.png
        └── sql-drop-success.png
```

Les noms de fichiers doivent rester identiques aux chemins utilisés dans ce document.

---

## 13. Conclusion

Les tests réalisés confirment que les scripts de création et d'insertion fonctionnent correctement sur une base PostgreSQL vide.

Les éléments suivants ont été validés :

- création des tables ;
- création des contraintes ;
- création des index ;
- insertion des données de démonstration ;
- mise à jour des séquences ;
- consultation des données ;
- conservation des caractères accentués ;
- validation des transactions avec `COMMIT`.

Le script de suppression doit être testé et documenté avant la validation complète du livrable.