# Innov'Events — Documentation de l'API

Cette documentation décrit les routes actuellement disponibles dans l’API Django REST du projet **Innov'Events**.

Base locale :

```text
http://localhost:8000
```

Préfixe principal :

```text
/api/
```

---

## 1. Authentification

L’API utilise des jetons JWT.

Après connexion, le client reçoit généralement :

```json
{
  "access": "jeton_acces",
  "refresh": "jeton_rafraichissement"
}
```

Les routes protégées doivent être appelées avec l’en-tête :

```http
Authorization: Bearer <access_token>
```

---

## 2. Codes HTTP courants

| Code | Signification |
|---|---|
| `200` | Requête réussie |
| `201` | Ressource créée |
| `204` | Suppression réussie |
| `400` | Données invalides |
| `401` | Authentification requise |
| `403` | Accès interdit |
| `404` | Ressource introuvable |

---

## 3. Santé de l’API

### GET `/api/health/`

Vérifie que le backend répond.

Accès :

```text
Public
```

Réponse :

```json
{
  "status": "ok"
}
```

---

## 4. Configuration publique

### GET `/api/public-config/`

Retourne les valeurs publiques nécessaires au frontend.

Accès :

```text
Public
```

Exemple de réponse :

```json
{
  "thank_you_message": "Merci ! Votre demande de devis a bien été envoyée."
}
```

---

## 5. Connexion JWT

### POST `/api/login/`

Authentifie un utilisateur.

Accès :

```text
Public
```

Corps :

```json
{
  "username": "admin",
  "password": "mot_de_passe"
}
```

Réponse réussie :

```json
{
  "access": "jeton_acces",
  "refresh": "jeton_rafraichissement"
}
```

La connexion réussie ou échouée est journalisée dans MongoDB lorsqu’il est disponible.

---

## 6. Rafraîchir un jeton

### POST `/api/token/refresh/`

Génère un nouveau jeton d’accès.

Accès :

```text
Public avec un refresh token valide
```

Corps :

```json
{
  "refresh": "jeton_rafraichissement"
}
```

Réponse :

```json
{
  "access": "nouveau_jeton_acces"
}
```

---

## 7. Utilisateur connecté

### GET `/api/me/`

Retourne les informations de l’utilisateur connecté.

Accès :

```text
Utilisateur authentifié
```

Réponse :

```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@innovevents.local",
  "is_staff": true,
  "is_superuser": true
}
```

---

## 8. Inscription

### POST `/api/signup/`

Crée un utilisateur.

Accès :

```text
Public
```

Corps :

```json
{
  "username": "client.demo",
  "email": "client@example.com",
  "password": "motdepasse123"
}
```

Contraintes :

- nom d’utilisateur obligatoire ;
- mot de passe de 8 caractères minimum ;
- nom d’utilisateur unique ;
- email unique lorsqu’il est renseigné.

Réponse réussie :

```json
{
  "id": 12,
  "username": "client.demo",
  "email": "client@example.com"
}
```

Erreurs possibles :

```json
{
  "username": ["Obligatoire."]
}
```

```json
{
  "password": ["8 caractères minimum."]
}
```

---

## 9. Mot de passe oublié

### POST `/api/forgot-password/`

Crée un mot de passe temporaire et l’envoie par email lorsque le compte existe.

Accès :

```text
Public
```

Corps :

```json
{
  "email": "client@example.com"
}
```

Réponse volontairement identique que le compte existe ou non :

```json
{
  "detail": "Si cet email existe, un mail a été envoyé."
}
```

Le backend utilise actuellement un système d’envoi d’email pouvant être configuré en mode console.

---

## 10. Changer son mot de passe

### POST `/api/change-password/`

Modifie le mot de passe de l’utilisateur connecté.

Accès :

```text
Utilisateur authentifié
```

Corps :

```json
{
  "password": "nouveauMotDePasse123"
}
```

Réponse :

```json
{
  "detail": "Mot de passe mis à jour."
}
```

Le mot de passe doit contenir au moins 8 caractères.

---

# 11. Événements

Préfixe :

```text
/api/events/
```

## GET `/api/events/`

Liste les événements.

Accès :

```text
Public
```

Filtres disponibles :

```text
public
event_type
theme
start_after
start_before
upcoming
```

Exemples :

```text
/api/events/?public=1
/api/events/?event_type=SEMINAR
/api/events/?theme=innovation
/api/events/?start_after=2026-07-01
/api/events/?start_before=2026-12-31
/api/events/?upcoming=5
```

Lorsque `public` est présent, seuls les événements :

- visibles ;
- approuvés par le client ;
- non brouillons ;

sont retournés.

## GET `/api/events/{id}/`

Retourne un événement.

Accès :

```text
Public
```

## POST `/api/events/`

Crée un événement.

Accès :

```text
Administrateur Django ou compte staff
```

## PUT/PATCH `/api/events/{id}/`

Modifie un événement.

Accès :

```text
Administrateur Django ou compte staff
```

## DELETE `/api/events/{id}/`

Supprime un événement.

Accès :

```text
Administrateur Django ou compte staff
```

---

# 12. Réservations

Préfixe :

```text
/api/bookings/
```

## GET `/api/bookings/`

Liste les réservations.

Accès :

```text
Utilisateur authentifié
```

Comportement :

- un administrateur voit toutes les réservations ;
- un utilisateur standard voit uniquement ses réservations.

## POST `/api/bookings/`

Crée une réservation.

Accès :

```text
Utilisateur authentifié
```

Le backend impose automatiquement :

```text
user = utilisateur connecté
status = PENDING
```

Exemple de corps :

```json
{
  "event": 4,
  "quantity": 2
}
```

## GET `/api/bookings/{id}/`

Retourne une réservation accessible à l’utilisateur.

## PUT/PATCH `/api/bookings/{id}/`

Modifie une réservation selon les permissions du ViewSet.

## DELETE `/api/bookings/{id}/`

Supprime une réservation selon les permissions du ViewSet.

## POST `/api/bookings/{id}/cancel/`

Annule une réservation.

Accès :

```text
Utilisateur authentifié ayant accès à la réservation
```

Réponse :

```json
{
  "detail": "Réservation annulée."
}
```

Erreur si elle est déjà annulée :

```json
{
  "detail": "Réservation déjà annulée."
}
```

## POST `/api/bookings/{id}/confirm/`

Confirme une réservation.

Accès :

```text
Administrateur Django ou compte staff
```

Erreur si la réservation est annulée.

---

# 13. Prospects

Préfixe :

```text
/api/prospects/
```

## POST `/api/prospects/`

Crée une demande de devis publique.

Accès :

```text
Public
```

Exemple de corps :

```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "jean.dupont@example.com",
  "phone": "0600000000",
  "company": "Entreprise Demo",
  "city": "Lyon",
  "message": "Demande de devis",
  "event_type": "SEMINAR",
  "desired_date": "2026-09-15",
  "participant_count": 50
}
```

Le prospect est créé avec le statut :

```text
TO_CONTACT
```

Un email de notification peut être envoyé au contact Innov'Events.

## GET `/api/prospects/`

Liste les prospects.

Accès :

```text
Administrateur Django ou compte staff
```

## GET `/api/prospects/{id}/`

Retourne un prospect.

Accès :

```text
Administrateur Django ou compte staff
```

## PUT/PATCH `/api/prospects/{id}/`

Modifie un prospect.

Accès :

```text
Administrateur Django ou compte staff
```

## DELETE `/api/prospects/{id}/`

Supprime un prospect.

Accès :

```text
Administrateur Django ou compte staff
```

## PATCH `/api/prospects/{id}/status/`

Modifie uniquement le statut.

Accès :

```text
Administrateur Django ou compte staff
```

Corps :

```json
{
  "status": "CONTACTED"
}
```

Statuts disponibles :

```text
TO_CONTACT
CONTACTED
QUALIFIED
ARCHIVED
```

## POST `/api/prospects/{id}/convert/`

Convertit un prospect en client.

Accès :

```text
Administrateur Django ou compte staff
```

Effets :

- création d’un utilisateur ;
- création d’un profil client ;
- génération d’un mot de passe temporaire ;
- passage du prospect au statut `QUALIFIED` ;
- journalisation de l’action ;
- envoi d’un email au client.

Erreur possible :

```json
{
  "detail": "Compte existant pour cet email."
}
```

Réponse réussie :

```json
{
  "user_id": 15,
  "username": "jean.dupont",
  "email": "jean.dupont@example.com"
}
```

---

# 14. Devis

Préfixe :

```text
/api/quotes/
```

## GET `/api/quotes/`

Liste les devis.

Accès :

```text
Utilisateur authentifié
```

Comportement :

- un administrateur voit tous les devis ;
- un client voit uniquement ses devis.

## GET `/api/quotes/{id}/`

Retourne un devis accessible à l’utilisateur.

## POST `/api/quotes/`

Crée un devis.

Accès :

```text
Administrateur Django ou compte staff
```

## PUT/PATCH `/api/quotes/{id}/`

Modifie un devis.

Accès :

```text
Administrateur Django ou compte staff
```

## DELETE `/api/quotes/{id}/`

Supprime un devis.

Accès :

```text
Administrateur Django ou compte staff
```

## POST `/api/quotes/{id}/accept/`

Accepte un devis.

Accès :

```text
Utilisateur authentifié ayant accès au devis
```

Réponse :

```json
{
  "status": "ACCEPTED"
}
```

## POST `/api/quotes/{id}/refuse/`

Refuse un devis.

Réponse :

```json
{
  "status": "REFUSED"
}
```

## POST `/api/quotes/{id}/request-change/`

Demande une modification du devis.

Corps :

```json
{
  "reason": "Modifier le nombre de participants."
}
```

Effets :

- statut `CHANGE_REQUESTED` ;
- création d’une note associée.

## GET `/api/quotes/{id}/pdf/`

Génère un PDF du devis.

Accès :

```text
Utilisateur authentifié ayant accès au devis
```

Réponse :

```text
application/pdf
```

Nom de fichier :

```text
devis_{id}.pdf
```

La génération est journalisée.

---

# 15. Notes

Préfixe :

```text
/api/notes/
```

Toutes les opérations sont réservées aux administrateurs Django ou comptes staff.

## GET `/api/notes/`

Liste les notes.

## POST `/api/notes/`

Crée une note.

L’auteur est automatiquement défini comme l’utilisateur connecté.

Exemple :

```json
{
  "client": 8,
  "content": "Client à rappeler.",
  "pinned": true
}
```

## GET `/api/notes/{id}/`

Retourne une note.

## PUT/PATCH `/api/notes/{id}/`

Modifie une note.

## DELETE `/api/notes/{id}/`

Supprime une note.

---

# 16. Avis

Préfixe :

```text
/api/reviews/
```

## GET `/api/reviews/`

Liste les avis.

Accès :

```text
Public
```

## GET `/api/reviews/{id}/`

Retourne un avis.

Accès :

```text
Public
```

## POST `/api/reviews/`

Crée un avis.

Accès :

```text
Utilisateur authentifié
```

L’auteur est automatiquement défini comme l’utilisateur connecté.

Exemple :

```json
{
  "rating": 5,
  "content": "Très bonne organisation."
}
```

La note doit être comprise entre 1 et 5.

## DELETE `/api/reviews/{id}/`

Supprime un avis.

Accès :

```text
Administrateur Django ou compte staff
```

La modification d’un avis n’est pas exposée par ce ViewSet.

---

# 17. Gestion des droits administrateur

Préfixe :

```text
/api/users-rights/
```

Accès réservé aux utilisateurs considérés comme administrateurs du dashboard :

- `is_staff=True` ;
- ou `is_superuser=True` ;
- ou rôle `ADMIN`.

## GET `/api/users-rights/`

Liste les utilisateurs et leurs droits.

## GET `/api/users-rights/{id}/`

Retourne un utilisateur.

## PATCH `/api/users-rights/{id}/promote-admin/`

Donne les droits administrateur du dashboard.

Effets :

```text
role = ADMIN
is_staff = True
```

Impossible de modifier un superutilisateur Django par cette route.

## PATCH `/api/users-rights/{id}/remove-admin/`

Retire les droits administrateur.

Effets possibles :

```text
role = CLIENT
is_staff = False
```

Restrictions :

- impossible de retirer ses propres droits ;
- impossible de modifier un superutilisateur Django.

---

## 18. Pagination

L’API utilise la pagination Django REST Framework.

Taille par défaut :

```text
10 éléments par page
```

Exemple :

```text
/api/prospects/?page=2
```

Une réponse paginée peut contenir :

```json
{
  "count": 25,
  "next": "http://localhost:8000/api/prospects/?page=2",
  "previous": null,
  "results": []
}
```

---

## 19. Permissions récapitulatives

| Ressource | Public | Authentifié | Admin/staff |
|---|---:|---:|---:|
| Santé API | Oui | Oui | Oui |
| Configuration publique | Oui | Oui | Oui |
| Connexion | Oui | Oui | Oui |
| Inscription | Oui | Oui | Oui |
| Mot de passe oublié | Oui | Oui | Oui |
| Événements en lecture | Oui | Oui | Oui |
| Événements en écriture | Non | Non | Oui |
| Création prospect | Oui | Oui | Oui |
| Gestion prospects | Non | Non | Oui |
| Réservations personnelles | Non | Oui | Oui |
| Confirmation réservation | Non | Non | Oui |
| Devis du client | Non | Oui | Oui |
| Création de devis | Non | Non | Oui |
| Notes | Non | Non | Oui |
| Avis en lecture | Oui | Oui | Oui |
| Création d’avis | Non | Oui | Oui |
| Suppression d’avis | Non | Non | Oui |
| Gestion des droits | Non | Non | Admin dashboard |

---

## 20. Journalisation MongoDB

Certaines actions sont journalisées avec `log_action`, notamment :

- connexion réussie ;
- connexion échouée ;
- création d’un client ;
- ajout de droits administrateur ;
- retrait de droits administrateur ;
- génération d’un PDF de devis.

La disponibilité de cette journalisation dépend de la configuration MongoDB.

---

## 21. Exemples avec PowerShell

### Santé

```powershell
Invoke-RestMethod http://localhost:8000/api/health/
```

### Connexion

```powershell
$login = Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/api/login/ `
  -ContentType "application/json" `
  -Body '{"username":"admin","password":"mot_de_passe"}'
```

### Appel authentifié

```powershell
$headers = @{
  Authorization = "Bearer $($login.access)"
}

Invoke-RestMethod `
  -Uri http://localhost:8000/api/me/ `
  -Headers $headers
```

---

## 22. Limites actuelles

- La documentation dépend des serializers pour le détail exact de certains champs.
- La page frontend de mot de passe oublié n’est pas encore reliée à une route.
- Certains parcours frontend sont encore en cours de finalisation.
- Les tests end-to-end automatisés restent à compléter.
- L’envoi d’email peut fonctionner en mode console selon l’environnement.
- La journalisation MongoDB doit être validée sur tous les parcours.

---

## Conclusion

L’API Innov'Events couvre actuellement :

- l’authentification ;
- les comptes utilisateurs ;
- les événements ;
- les réservations ;
- les prospects ;
- les devis ;
- les notes ;
- les avis ;
- la gestion des droits administrateur ;
- la génération de PDF ;
- la journalisation de plusieurs actions sensibles.

Les permissions sont réparties entre accès public, utilisateur authentifié et administrateur/staff.