# MLD — Modèle logique de données

## 1. Objectif

Le modèle logique de données traduit le MCD d’Innov’Events sous forme de relations.

Il présente :

- les relations ;
- les attributs ;
- les clés primaires ;
- les clés étrangères ;
- les attributs facultatifs ;
- les principales contraintes logiques.

Le MLD reste indépendant des types physiques propres à PostgreSQL.

## 2. Conventions

- `PK` : clé primaire ;
- `FK` : clé étrangère ;
- `UQ` : valeur unique ;
- `NULL` : valeur facultative.

Les noms d’attributs sont conservés en anglais afin de rester cohérents avec les modèles Django du projet.

## 3. Relations

### UTILISATEUR

```text
UTILISATEUR(
    PK id,
    password,
    last_login NULL,
    is_superuser,
    UQ username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    must_change_password
)
```

Cette relation reprend les attributs métier du modèle personnalisé `User` ainsi que les attributs hérités de `AbstractUser`.

Valeurs possibles pour `role` :

```text
ADMIN
EMPLOYEE
CLIENT
```

### PROFIL_CLIENT

```text
PROFIL_CLIENT(
    PK id,
    company,
    phone,
    address,
    FK UQ user_id
)
```

Référence :

```text
PROFIL_CLIENT.user_id → UTILISATEUR.id
```

La contrainte `UQ` sur `user_id` traduit la relation un-à-un : un utilisateur possède au maximum un profil client.

### PROSPECT

```text
PROSPECT(
    PK id,
    first_name,
    last_name,
    email,
    phone,
    company,
    city,
    message,
    event_type,
    desired_date NULL,
    participant_count NULL,
    status,
    created_at
)
```

Valeurs possibles pour `status` :

```text
TO_CONTACT
CONTACTED
QUALIFIED
ARCHIVED
```

### EVENEMENT

```text
EVENEMENT(
    PK id,
    title,
    description,
    city,
    start_at,
    end_at NULL,
    capacity,
    event_type,
    theme,
    image NULL,
    status,
    visible,
    client_agreed,
    created_at,
    FK organizer_id,
    FK client_id NULL
)
```

Références :

```text
EVENEMENT.organizer_id → UTILISATEUR.id
EVENEMENT.client_id    → UTILISATEUR.id
```

Valeurs possibles pour `event_type` :

```text
SEMINAR
CONFERENCE
PARTY
OTHER
```

Valeurs possibles pour `status` :

```text
DRAFT
ACCEPTED
IN_PROGRESS
DONE
CANCELLED
```

### RESERVATION

```text
RESERVATION(
    PK id,
    quantity,
    status,
    created_at,
    FK user_id,
    FK event_id
)
```

Références :

```text
RESERVATION.user_id  → UTILISATEUR.id
RESERVATION.event_id → EVENEMENT.id
```

Valeurs possibles pour `status` :

```text
PENDING
CONFIRMED
CANCELLED
```

### DEVIS

```text
DEVIS(
    PK id,
    status,
    tva_rate,
    created_at,
    FK client_id NULL,
    FK prospect_id NULL
)
```

Références :

```text
DEVIS.client_id   → UTILISATEUR.id
DEVIS.prospect_id → PROSPECT.id
```

Valeurs possibles pour `status` :

```text
DRAFT
SENT
ACCEPTED
REFUSED
CHANGE_REQUESTED
```

Les valeurs suivantes ne sont pas stockées dans la relation `DEVIS` :

```text
total_ht
total_tva
total_ttc
```

Elles sont calculées par l’application à partir des lignes de devis.

### LIGNE_DEVIS

```text
LIGNE_DEVIS(
    PK id,
    label,
    amount_ht,
    FK quote_id
)
```

Référence :

```text
LIGNE_DEVIS.quote_id → DEVIS.id
```

### NOTE

```text
NOTE(
    PK id,
    content,
    pinned,
    created_at,
    FK author_id,
    FK client_id NULL
)
```

Références :

```text
NOTE.author_id → UTILISATEUR.id
NOTE.client_id → UTILISATEUR.id
```

### AVIS

```text
AVIS(
    PK id,
    rating,
    content,
    created_at,
    FK author_id
)
```

Référence :

```text
AVIS.author_id → UTILISATEUR.id
```

## 4. Vue synthétique

```text
UTILISATEUR(
    PK id,
    password,
    last_login NULL,
    is_superuser,
    UQ username,
    first_name,
    last_name,
    email,
    is_staff,
    is_active,
    date_joined,
    role,
    must_change_password
)

PROFIL_CLIENT(
    PK id,
    company,
    phone,
    address,
    FK UQ user_id
)

PROSPECT(
    PK id,
    first_name,
    last_name,
    email,
    phone,
    company,
    city,
    message,
    event_type,
    desired_date NULL,
    participant_count NULL,
    status,
    created_at
)

EVENEMENT(
    PK id,
    title,
    description,
    city,
    start_at,
    end_at NULL,
    capacity,
    event_type,
    theme,
    image NULL,
    status,
    visible,
    client_agreed,
    created_at,
    FK organizer_id,
    FK client_id NULL
)

RESERVATION(
    PK id,
    quantity,
    status,
    created_at,
    FK user_id,
    FK event_id
)

DEVIS(
    PK id,
    status,
    tva_rate,
    created_at,
    FK client_id NULL,
    FK prospect_id NULL
)

LIGNE_DEVIS(
    PK id,
    label,
    amount_ht,
    FK quote_id
)

NOTE(
    PK id,
    content,
    pinned,
    created_at,
    FK author_id,
    FK client_id NULL
)

AVIS(
    PK id,
    rating,
    content,
    created_at,
    FK author_id
)
```

## 5. Contraintes logiques

### Utilisateur

- `username` est unique.
- `role` doit correspondre à une valeur autorisée.
- `last_login` peut être absent.

### Profil client

- `user_id` est obligatoire.
- `user_id` est unique.
- Un profil client appartient à un seul utilisateur.
- Un utilisateur possède au maximum un profil client.

### Prospect

- `desired_date` est facultatif.
- `participant_count` est facultatif.
- `status` doit correspondre à une valeur autorisée.

### Événement

- `organizer_id` est obligatoire.
- `client_id` est facultatif.
- `end_at` est facultatif.
- `image` est facultative.
- `capacity` doit être positive.
- `event_type` doit correspondre à une valeur autorisée.
- `status` doit correspondre à une valeur autorisée.

### Réservation

- `user_id` est obligatoire.
- `event_id` est obligatoire.
- `quantity` doit être positive.
- `status` doit correspondre à une valeur autorisée.

Le modèle actuel n’impose pas l’unicité du couple :

```text
(user_id, event_id)
```

Un utilisateur peut donc avoir plusieurs réservations distinctes pour un même événement.

### Devis

- `client_id` est facultatif.
- `prospect_id` est facultatif.
- `status` doit correspondre à une valeur autorisée.
- `tva_rate` doit être positif ou nul.

Règle métier attendue :

```text
Un devis concerne un utilisateur client ou un prospect,
mais jamais les deux simultanément.
```

Cette règle n’est pas encore garantie directement par le modèle Django.

### Ligne de devis

- `quote_id` est obligatoire.
- `amount_ht` doit être positif ou nul.
- Une ligne de devis appartient à un seul devis.

### Note

- `author_id` est obligatoire.
- `client_id` est facultatif.
- Une note possède obligatoirement un auteur.

### Avis

- `author_id` est obligatoire.
- `rating` doit être compris entre 1 et 5.

## 6. Règles de suppression

Les règles suivantes correspondent aux comportements définis dans les modèles Django.

| Relation | Comportement |
|---|---|
| Suppression d’un utilisateur lié à un profil client | suppression du profil client |
| Suppression de l’organisateur d’un événement | suppression de l’événement |
| Suppression du client d’un événement | conservation de l’événement et mise à `NULL` |
| Suppression d’un utilisateur ayant des réservations | suppression de ses réservations |
| Suppression d’un événement | suppression de ses réservations |
| Suppression du client d’un devis | conservation du devis et mise à `NULL` |
| Suppression d’un prospect | conservation du devis et mise à `NULL` |
| Suppression d’un devis | suppression de ses lignes |
| Suppression de l’auteur d’une note | suppression de la note |
| Suppression du client concerné par une note | conservation de la note et mise à `NULL` |
| Suppression de l’auteur d’un avis | suppression de l’avis |

## 7. Correspondance avec Django

| Relation du MLD | Modèle Django |
|---|---|
| UTILISATEUR | `accounts.User` |
| PROFIL_CLIENT | `crm.ClientProfile` |
| PROSPECT | `crm.Prospect` |
| EVENEMENT | `events.Event` |
| RESERVATION | `bookings.Booking` |
| DEVIS | `crm.Quote` |
| LIGNE_DEVIS | `crm.QuoteItem` |
| NOTE | `crm.Note` |
| AVIS | `reviews.Review` |

## 8. Éléments techniques exclus

Les tables techniques créées par Django pour les groupes, permissions, sessions, migrations et administration ne font pas partie de ce MLD métier.

Elles seront prises en compte uniquement si un inventaire physique complet de toute la base Django est demandé.