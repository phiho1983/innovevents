## Utilisation des scripts SQL

Les scripts SQL présents dans ce dossier constituent des livrables
documentaires et pédagogiques.

Dans l’application Innov’Events, la création et l’évolution du schéma sont
gérées par les migrations Django.

Le script `01_create_schema.sql` permet de présenter une implémentation
manuelle équivalente du schéma métier PostgreSQL. Il doit être exécuté
uniquement sur une base de démonstration vide et ne doit pas être appliqué
sur une base déjà initialisée par Django.

