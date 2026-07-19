# MCD — Modèle conceptuel de données

## 1. Objectif

Le modèle conceptuel de données présente les principales données métier de l'application Innov'Events ainsi que les associations entre elles.

Il reste indépendant de Django, de PostgreSQL et de l'implémentation technique des tables.

Le diagramme graphique associé est disponible dans le fichier :

```text
innovevents_mcd_central.drawio
```

## 2. Périmètre

Le MCD couvre les données relationnelles gérées par PostgreSQL :

- les utilisateurs ;
- les profils clients ;
- les prospects ;
- les événements ;
- les réservations ;
- les devis ;
- les lignes de devis ;
- les notes internes ;
- les avis.

La journalisation des actions sensibles dans MongoDB ne fait pas partie de ce MCD relationnel.

## 3. Entités

### UTILISATEUR

Représente une personne disposant d'un compte dans l'application.

Attributs principaux :

- identifiant ;
- nom d'utilisateur ;
- mot de passe ;
- prénom ;
- nom ;
- adresse e-mail ;
- rôle ;
- statut actif ;
- obligation de modifier le mot de passe ;
- date d'inscription ;
- date de dernière connexion.

Rôles possibles :

- administrateur ;
- employé ;
- client.

### PROFIL_CLIENT

Contient les informations complémentaires d'un utilisateur client.

Attributs principaux :

- identifiant ;
- société ;
- téléphone ;
- adresse.

### PROSPECT

Représente une personne ou une organisation ayant manifesté un intérêt pour les services d'Innov'Events.

Attributs principaux :

- identifiant ;
- prénom ;
- nom ;
- adresse e-mail ;
- téléphone ;
- société ;
- ville ;
- message ;
- type d'événement souhaité ;
- date souhaitée ;
- nombre de participants ;
- statut ;
- date de création.

Statuts possibles :

- à contacter ;
- contacté ;
- qualifié ;
- archivé.

### EVENEMENT

Représente un événement organisé par Innov'Events.

Attributs principaux :

- identifiant ;
- titre ;
- description ;
- ville ;
- date et heure de début ;
- date et heure de fin ;
- capacité ;
- type d'événement ;
- thème ;
- image ;
- statut ;
- visibilité ;
- accord du client ;
- date de création.

Types possibles :

- séminaire ;
- conférence ;
- soirée d'entreprise ;
- autre.

Statuts possibles :

- brouillon ;
- accepté ;
- en cours ;
- terminé ;
- annulé.

### RESERVATION

Représente la réservation d'un événement par un utilisateur.

Attributs principaux :

- identifiant ;
- quantité ;
- statut ;
- date de création.

Statuts possibles :

- en attente ;
- confirmée ;
- annulée.

### DEVIS

Représente une proposition commerciale adressée à un client ou à un prospect.

Attributs principaux :

- identifiant ;
- statut ;
- taux de TVA ;
- date de création.

Statuts possibles :

- brouillon ;
- envoyé ;
- accepté ;
- refusé ;
- modification demandée.

Les montants totaux hors taxes, de TVA et toutes taxes comprises sont calculés à partir des lignes de devis.

### LIGNE_DEVIS

Représente une ligne commerciale appartenant à un devis.

Attributs principaux :

- identifiant ;
- libellé ;
- montant hors taxes.

### NOTE

Représente une note interne rédigée par un utilisateur au sujet d'un client.

Attributs principaux :

- identifiant ;
- contenu ;
- indicateur d'épinglage ;
- date de création.

### AVIS

Représente un avis publié par un utilisateur.

Attributs principaux :

- identifiant ;
- note ;
- contenu ;
- date de création.

La note est comprise entre 1 et 5.

## 4. Associations et cardinalités

### Posséder

Un utilisateur peut posséder zéro ou un profil client.

Un profil client appartient obligatoirement à un seul utilisateur.

```text
UTILISATEUR (0,1) — POSSEDER — (1,1) PROFIL_CLIENT
```

### Organiser

Un utilisateur peut organiser zéro, un ou plusieurs événements.

Un événement est obligatoirement organisé par un seul utilisateur.

```text
UTILISATEUR (0,N) — ORGANISER — (1,1) EVENEMENT
```

### Être client d'un événement

Un utilisateur peut être le client de zéro, un ou plusieurs événements.

Un événement peut ne pas avoir de client ou être associé à un seul utilisateur client.

```text
UTILISATEUR (0,N) — ETRE_CLIENT — (0,1) EVENEMENT
```

### Effectuer

Un utilisateur peut effectuer zéro, une ou plusieurs réservations.

Une réservation est obligatoirement effectuée par un seul utilisateur.

```text
UTILISATEUR (0,N) — EFFECTUER — (1,1) RESERVATION
```

### Concerner

Un événement peut être concerné par zéro, une ou plusieurs réservations.

Une réservation concerne obligatoirement un seul événement.

```text
EVENEMENT (0,N) — CONCERNER — (1,1) RESERVATION
```

### Recevoir un devis en tant que client

Un utilisateur peut recevoir zéro, un ou plusieurs devis.

Un devis peut être associé à zéro ou un utilisateur client.

```text
UTILISATEUR (0,N) — RECEVOIR — (0,1) DEVIS
```

### Recevoir un devis en tant que prospect

Un prospect peut recevoir zéro, un ou plusieurs devis.

Un devis peut être associé à zéro ou un prospect.

```text
PROSPECT (0,N) — RECEVOIR — (0,1) DEVIS
```

### Contenir

Un devis contient une ou plusieurs lignes de devis.

Une ligne de devis appartient obligatoirement à un seul devis.

```text
DEVIS (1,N) — CONTENIR — (1,1) LIGNE_DEVIS
```

### Rédiger

Un utilisateur peut rédiger zéro, une ou plusieurs notes.

Une note est obligatoirement rédigée par un seul utilisateur.

```text
UTILISATEUR (0,N) — REDIGER — (1,1) NOTE
```

### Concerner un client

Un utilisateur peut être concerné par zéro, une ou plusieurs notes.

Une note peut ne concerner aucun client ou concerner un seul utilisateur client.

```text
UTILISATEUR (0,N) — ETRE_CONCERNE — (0,1) NOTE
```

### Publier

Un utilisateur peut publier zéro, un ou plusieurs avis.

Un avis est obligatoirement publié par un seul utilisateur.

```text
UTILISATEUR (0,N) — PUBLIER — (1,1) AVIS
```

## 5. Règles de gestion

- Une adresse e-mail utilisateur doit être unique.
- Un nom d'utilisateur doit être unique.
- Un utilisateur possède au maximum un profil client.
- Un événement possède obligatoirement un organisateur.
- La date de fin d'un événement, lorsqu'elle est renseignée, doit être postérieure à sa date de début.
- La capacité d'un événement doit être strictement positive.
- Une réservation appartient obligatoirement à un utilisateur et à un événement.
- La quantité d'une réservation doit être strictement positive.
- Un devis doit concerner un client ou un prospect.
- Un devis ne doit pas concerner simultanément un client et un prospect.
- Un devis doit contenir au minimum une ligne.
- Le taux de TVA d'un devis doit être positif ou nul.
- Le montant hors taxes d'une ligne de devis doit être positif ou nul.
- Une note possède obligatoirement un auteur.
- Une note peut être liée à un client.
- Un avis possède obligatoirement un auteur.
- La note d'un avis doit être comprise entre 1 et 5.

## 6. Vue synthétique

```text
                         PROFIL_CLIENT
                              |
                           POSSEDER
                              |
NOTE —— REDIGER —— UTILISATEUR —— ORGANISER —— EVENEMENT
                         |                    |
                      PUBLIER              CONCERNER
                         |                    |
                       AVIS              RESERVATION
                         |
                      RECEVOIR
                         |
                       DEVIS —— CONTENIR —— LIGNE_DEVIS
                         |
                      RECEVOIR
                         |
                      PROSPECT
```

## 7. Source de référence

Ce MCD a été construit à partir des modèles Django présents dans :

```text
apps/back/accounts/models.py
apps/back/crm/models.py
apps/back/events/models.py
apps/back/bookings/models.py
apps/back/reviews/models.py
```