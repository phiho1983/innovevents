# Dictionnaire de données — Innov’Events

## 1. Objet

Ce document décrit les données métier stockées dans la base PostgreSQL du projet Innov’Events.

### Légende

- **PK** : clé primaire ;
- **FK** : clé étrangère ;
- **UQ** : contrainte d’unicité ;
- **NN** : valeur obligatoire ;
- **NULL** : valeur facultative.

---

## 2. Table `accounts_user`

**Description :** comptes utilisateurs de l’application.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de l’utilisateur |
| `password` | `VARCHAR(128)` | NN | — | Hash du mot de passe Django |
| `last_login` | `TIMESTAMPTZ` | NULL | `NULL` | Date et heure de dernière connexion |
| `is_superuser` | `BOOLEAN` | NN | `FALSE` | Indique si l’utilisateur possède tous les droits |
| `username` | `VARCHAR(150)` | NN, UQ | — | Nom de connexion unique |
| `first_name` | `VARCHAR(150)` | NN | `''` | Prénom de l’utilisateur |
| `last_name` | `VARCHAR(150)` | NN | `''` | Nom de l’utilisateur |
| `email` | `VARCHAR(254)` | NN | `''` | Adresse électronique |
| `is_staff` | `BOOLEAN` | NN | `FALSE` | Autorise l’accès à l’administration Django |
| `is_active` | `BOOLEAN` | NN | `TRUE` | Indique si le compte est actif |
| `date_joined` | `TIMESTAMPTZ` | NN | — | Date de création du compte |
| `role` | `VARCHAR(20)` | NN, CHECK | `'CLIENT'` | Rôle métier de l’utilisateur |
| `must_change_password` | `BOOLEAN` | NN | `FALSE` | Obligation de modifier le mot de passe |

### Domaine de valeurs — `role`

| Valeur | Libellé |
|---|---|
| `ADMIN` | Administrateur |
| `EMPLOYEE` | Employé |
| `CLIENT` | Client |

---

## 3. Table `crm_clientprofile`

**Description :** informations complémentaires associées à un utilisateur client.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique du profil |
| `user_id` | `BIGINT` | FK, UQ, NN | — | Utilisateur associé au profil |
| `company` | `VARCHAR(120)` | NN | `''` | Société du client |
| `phone` | `VARCHAR(30)` | NN | `''` | Numéro de téléphone |
| `address` | `VARCHAR(255)` | NN | `''` | Adresse postale |

### Référence

```text
crm_clientprofile.user_id → accounts_user.id
```

### Règle de suppression

```text
ON DELETE CASCADE
```

---

## 4. Table `crm_prospect`

**Description :** personnes ou organisations ayant soumis une demande commerciale sans disposer nécessairement d’un compte client.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique du prospect |
| `first_name` | `VARCHAR(80)` | NN | — | Prénom |
| `last_name` | `VARCHAR(80)` | NN | — | Nom |
| `email` | `VARCHAR(254)` | NN | — | Adresse électronique |
| `phone` | `VARCHAR(30)` | NN | — | Numéro de téléphone |
| `company` | `VARCHAR(120)` | NN | `''` | Société |
| `city` | `VARCHAR(120)` | NN | — | Ville |
| `message` | `TEXT` | NN | — | Description de la demande |
| `event_type` | `VARCHAR(50)` | NN | `''` | Type d’événement souhaité |
| `desired_date` | `DATE` | NULL | `NULL` | Date souhaitée |
| `participant_count` | `INTEGER` | NULL, CHECK | `NULL` | Nombre prévisionnel de participants |
| `status` | `VARCHAR(20)` | NN, CHECK | `'TO_CONTACT'` | État de traitement du prospect |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de création |

### Domaine de valeurs — `status`

| Valeur | Libellé |
|---|---|
| `TO_CONTACT` | À contacter |
| `CONTACTED` | Contacté |
| `QUALIFIED` | Qualifié |
| `ARCHIVED` | Archivé |

### Règle de validation

```text
participant_count est NULL ou supérieur ou égal à 1
```

---

## 5. Table `events_event`

**Description :** événements organisés par Innov’Events.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de l’événement |
| `title` | `VARCHAR(200)` | NN | — | Titre de l’événement |
| `description` | `TEXT` | NN | `''` | Description détaillée |
| `city` | `VARCHAR(120)` | NN | — | Ville de l’événement |
| `start_at` | `TIMESTAMPTZ` | NN | — | Date et heure de début |
| `end_at` | `TIMESTAMPTZ` | NULL, CHECK | `NULL` | Date et heure de fin |
| `capacity` | `INTEGER` | NN, CHECK | `1` | Capacité maximale |
| `event_type` | `VARCHAR(20)` | NN, CHECK | `'OTHER'` | Type d’événement |
| `theme` | `VARCHAR(120)` | NN | `''` | Thème |
| `image` | `VARCHAR(100)` | NULL | `NULL` | Chemin relatif de l’image |
| `status` | `VARCHAR(20)` | NN, CHECK | `'DRAFT'` | Statut de l’événement |
| `visible` | `BOOLEAN` | NN | `FALSE` | Publication de l’événement |
| `client_agreed` | `BOOLEAN` | NN | `FALSE` | Accord du client |
| `organizer_id` | `BIGINT` | FK, NN | — | Utilisateur organisateur |
| `client_id` | `BIGINT` | FK, NULL | `NULL` | Utilisateur client associé |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de création |

### Domaine de valeurs — `event_type`

| Valeur | Libellé |
|---|---|
| `SEMINAR` | Séminaire |
| `CONFERENCE` | Conférence |
| `PARTY` | Soirée d’entreprise |
| `OTHER` | Autre |

### Domaine de valeurs — `status`

| Valeur | Libellé |
|---|---|
| `DRAFT` | Brouillon |
| `ACCEPTED` | Accepté |
| `IN_PROGRESS` | En cours |
| `DONE` | Terminé |
| `CANCELLED` | Annulé |

### Références

```text
events_event.organizer_id → accounts_user.id
events_event.client_id    → accounts_user.id
```

### Règles de suppression

```text
organizer_id : ON DELETE CASCADE
client_id    : ON DELETE SET NULL
```

### Règles de validation

```text
capacity >= 1
end_at est NULL ou end_at > start_at
```

---

## 6. Table `bookings_booking`

**Description :** réservations effectuées par les utilisateurs pour les événements.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de la réservation |
| `user_id` | `BIGINT` | FK, NN | — | Utilisateur ayant réservé |
| `event_id` | `BIGINT` | FK, NN | — | Événement réservé |
| `quantity` | `INTEGER` | NN, CHECK | `1` | Nombre de places réservées |
| `status` | `VARCHAR(20)` | NN, CHECK | `'PENDING'` | Statut de la réservation |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de création |

### Domaine de valeurs — `status`

| Valeur | Libellé |
|---|---|
| `PENDING` | En attente |
| `CONFIRMED` | Confirmée |
| `CANCELLED` | Annulée |

### Références

```text
bookings_booking.user_id  → accounts_user.id
bookings_booking.event_id → events_event.id
```

### Règles de suppression

```text
user_id  : ON DELETE CASCADE
event_id : ON DELETE CASCADE
```

### Règle de validation

```text
quantity >= 1
```

---

## 7. Table `crm_quote`

**Description :** devis adressés à un utilisateur client ou à un prospect.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique du devis |
| `client_id` | `BIGINT` | FK, NULL | `NULL` | Utilisateur client destinataire |
| `prospect_id` | `BIGINT` | FK, NULL | `NULL` | Prospect destinataire |
| `status` | `VARCHAR(30)` | NN, CHECK | `'DRAFT'` | Statut du devis |
| `tva_rate` | `NUMERIC(5,2)` | NN, CHECK | `0.20` | Taux de TVA sous forme décimale |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de création |

### Domaine de valeurs — `status`

| Valeur | Libellé |
|---|---|
| `DRAFT` | Brouillon |
| `SENT` | Envoyé |
| `ACCEPTED` | Accepté |
| `REFUSED` | Refusé |
| `CHANGE_REQUESTED` | Modification demandée |

### Références

```text
crm_quote.client_id   → accounts_user.id
crm_quote.prospect_id → crm_prospect.id
```

### Règles de suppression

```text
client_id   : ON DELETE SET NULL
prospect_id : ON DELETE SET NULL
```

### Règles de validation

```text
tva_rate >= 0
Le devis est lié soit à client_id, soit à prospect_id, jamais aux deux.
```

### Données calculées non stockées

| Donnée | Formule |
|---|---|
| `total_ht` | Somme des `amount_ht` des lignes |
| `total_tva` | `total_ht × tva_rate` |
| `total_ttc` | `total_ht + total_tva` |

---

## 8. Table `crm_quoteitem`

**Description :** lignes composant un devis.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de la ligne |
| `quote_id` | `BIGINT` | FK, NN | — | Devis auquel appartient la ligne |
| `label` | `VARCHAR(200)` | NN | — | Libellé de la prestation |
| `amount_ht` | `NUMERIC(10,2)` | NN, CHECK | — | Montant hors taxes |

### Référence

```text
crm_quoteitem.quote_id → crm_quote.id
```

### Règle de suppression

```text
ON DELETE CASCADE
```

### Règle de validation

```text
amount_ht >= 0
```

---

## 9. Table `crm_note`

**Description :** notes internes rédigées au sujet des clients.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de la note |
| `author_id` | `BIGINT` | FK, NN | — | Auteur de la note |
| `client_id` | `BIGINT` | FK, NULL | `NULL` | Client concerné |
| `content` | `TEXT` | NN | — | Contenu de la note |
| `pinned` | `BOOLEAN` | NN | `FALSE` | Indique si la note est épinglée |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de création |

### Références

```text
crm_note.author_id → accounts_user.id
crm_note.client_id → accounts_user.id
```

### Règles de suppression

```text
author_id : ON DELETE CASCADE
client_id : ON DELETE SET NULL
```

---

## 10. Table `reviews_review`

**Description :** avis publiés par les utilisateurs.

| Champ | Type | Contraintes | Valeur par défaut | Description |
|---|---|---|---|---|
| `id` | `BIGINT` | PK, NN | Identité | Identifiant unique de l’avis |
| `author_id` | `BIGINT` | FK, NN | — | Auteur de l’avis |
| `rating` | `SMALLINT` | NN, CHECK | `5` | Note attribuée |
| `content` | `TEXT` | NN | — | Contenu de l’avis |
| `created_at` | `TIMESTAMPTZ` | NN | — | Date de publication |

### Référence

```text
reviews_review.author_id → accounts_user.id
```

### Règle de suppression

```text
ON DELETE CASCADE
```

### Règle de validation

```text
rating BETWEEN 1 AND 5
```

---

## 11. Synthèse des relations

| Table source | Clé étrangère | Table cible | Cardinalité physique | Suppression |
|---|---|---|---|---|
| `crm_clientprofile` | `user_id` | `accounts_user` | 1–1 | CASCADE |
| `events_event` | `organizer_id` | `accounts_user` | N–1 | CASCADE |
| `events_event` | `client_id` | `accounts_user` | N–0..1 | SET NULL |
| `bookings_booking` | `user_id` | `accounts_user` | N–1 | CASCADE |
| `bookings_booking` | `event_id` | `events_event` | N–1 | CASCADE |
| `crm_quote` | `client_id` | `accounts_user` | N–0..1 | SET NULL |
| `crm_quote` | `prospect_id` | `crm_prospect` | N–0..1 | SET NULL |
| `crm_quoteitem` | `quote_id` | `crm_quote` | N–1 | CASCADE |
| `crm_note` | `author_id` | `accounts_user` | N–1 | CASCADE |
| `crm_note` | `client_id` | `accounts_user` | N–0..1 | SET NULL |
| `reviews_review` | `author_id` | `accounts_user` | N–1 | CASCADE |