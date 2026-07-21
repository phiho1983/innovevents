# Innov'Events — Guide administrateur

Ce guide décrit les fonctions actuellement disponibles dans l’administration Django du projet **Innov'Events**.

Adresse locale :

```text
http://localhost:8000/admin
```

L’accès est réservé à un compte autorisé, généralement un superutilisateur Django.

---

## 1. Se connecter à l’administration

Ouvrir :

```text
http://localhost:8000/admin
```

Utiliser le compte administrateur défini dans le fichier `.env` local :

```dotenv
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@innovevents.local
DJANGO_SUPERUSER_PASSWORD=mot_de_passe_choisi
```

Le mot de passe local peut être différent de celui utilisé sur la version déployée.

En cas d’oubli :

```powershell
cd infra\docker
docker compose exec backend python manage.py changepassword admin
```

---

## 2. Accès et droits

L’administration Django permet de gérer les données enregistrées dans PostgreSQL.

Les droits dépendent du compte utilisé :

- `is_active` : autorise ou non le compte ;
- `is_staff` : autorise l’accès à Django Admin ;
- `is_superuser` : donne tous les droits ;
- groupes et permissions : limitent les actions disponibles.

Un compte sans `is_staff=True` ne peut normalement pas accéder à Django Admin.

---

## 3. Réservations

Modèle disponible :

```text
Booking
```

La liste affiche :

- l’utilisateur ;
- l’événement ;
- la quantité ;
- le statut ;
- la date de création.

Filtres disponibles :

- statut ;
- date de création.

### Utilisation

L’administrateur peut :

- consulter les réservations ;
- vérifier l’utilisateur concerné ;
- vérifier l’événement réservé ;
- contrôler la quantité ;
- modifier le statut selon les droits disponibles.

---

## 4. Prospects

Modèle disponible :

```text
Prospect
```

La liste affiche :

- identifiant ;
- prénom ;
- nom ;
- email ;
- statut ;
- date de création.

Filtres disponibles :

- statut ;
- date de création.

Recherche disponible sur :

- prénom ;
- nom ;
- email ;
- téléphone ;
- ville.

### Utilisation

Les demandes de devis publiques peuvent créer des prospects.

L’administrateur peut :

- rechercher un prospect ;
- consulter ses coordonnées ;
- suivre son statut ;
- modifier ses informations ;
- poursuivre son traitement commercial.

---

## 5. Profils clients

Modèle disponible :

```text
ClientProfile
```

L’administration permet de consulter et modifier les profils clients enregistrés.

La présentation utilise actuellement la configuration Django Admin par défaut.

---

## 6. Devis

Modèle disponible :

```text
Quote
```

La liste affiche :

- identifiant ;
- statut ;
- client ;
- prospect ;
- date de création.

Filtres disponibles :

- statut ;
- date de création.

### Lignes de devis

Les éléments du devis sont gérés directement dans la fiche du devis grâce à une section intégrée :

```text
QuoteItem
```

Lors de la création ou modification d’un devis, l’administrateur peut ajouter une ou plusieurs lignes.

### Utilisation

L’administrateur peut :

- créer un devis ;
- associer le devis à un client ou un prospect ;
- ajouter des lignes de devis ;
- modifier le statut ;
- consulter la date de création.

---

## 7. Notes

Modèle disponible :

```text
Note
```

Les notes sont enregistrées dans Django Admin avec la présentation par défaut.

Elles peuvent servir à conserver des informations complémentaires liées au suivi commercial ou administratif.

---

## 8. Événements

Modèle disponible :

```text
Event
```

La liste affiche :

- titre ;
- ville ;
- date et heure de début ;
- capacité ;
- organisateur.

Recherche disponible sur :

- titre ;
- ville.

Filtres disponibles :

- ville ;
- date et heure de début.

### Utilisation

Même si la création d’événement n’est pas encore disponible depuis le frontend, l’administrateur peut gérer les événements dans Django Admin.

Il peut notamment :

- créer un événement ;
- modifier un événement ;
- définir la ville ;
- définir la date ;
- définir la capacité ;
- associer un organisateur ;
- supprimer un événement selon ses droits.

---

## 9. Avis

Modèle disponible :

```text
Review
```

La liste affiche :

- auteur ;
- note ;
- date de création.

Filtres disponibles :

- note ;
- date de création.

Recherche disponible sur :

- nom d’utilisateur de l’auteur ;
- email de l’auteur ;
- contenu de l’avis.

### Utilisation

L’administrateur peut :

- consulter les avis ;
- rechercher un avis ;
- vérifier sa note ;
- consulter son auteur ;
- modifier ou supprimer un avis selon ses droits.

---

## 10. Utilisateurs et groupes

Le projet utilise les fonctions d’authentification Django.

Selon la configuration active, l’administration peut permettre la gestion :

- des utilisateurs ;
- des groupes ;
- des permissions ;
- des mots de passe ;
- des statuts `actif`, `staff` et `superutilisateur`.

### Créer un administrateur en ligne de commande

```powershell
docker compose exec backend python manage.py createsuperuser
```

### Modifier un mot de passe

```powershell
docker compose exec backend python manage.py changepassword admin
```

---

## 11. Comptes applicatifs

Pour préparer une démonstration, l’administrateur peut créer les comptes nécessaires :

- administrateur ;
- employé ;
- client.

Selon le modèle utilisateur réellement utilisé par le projet, certains comptes peuvent être créés dans Django Admin ou via les formulaires de l’application.

Ne jamais utiliser de vraies données personnelles pour les comptes de démonstration.

---

## 12. Jetons d’authentification

L’administration peut également afficher des éléments techniques liés à l’authentification :

- jetons d’authentification ;
- jetons JWT actifs ;
- jetons JWT révoqués.

Ces éléments sont techniques.

Ils ne doivent pas être modifiés sans comprendre leur impact sur les sessions utilisateurs.

---

## 13. Bonnes pratiques

- Ne jamais publier les mots de passe.
- Ne pas utiliser les identifiants Render en local.
- Ne pas créer tous les comptes en superutilisateur.
- Attribuer uniquement les droits nécessaires.
- Vérifier les données avant suppression.
- Ne pas utiliser `docker compose down -v` si des données doivent être conservées.
- Utiliser des données fictives pour les démonstrations.
- Se déconnecter après utilisation de Django Admin.

---

## 14. Vérifications utiles

### Vérifier les conteneurs

```powershell
cd infra\docker
docker compose ps
```

### Vérifier Django

```powershell
docker compose exec backend python manage.py check
```

### Afficher les comptes

```powershell
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.values('username','email','is_staff','is_superuser','is_active')))"
```

### Consulter les journaux

```powershell
docker compose logs --tail=100 backend
```

---

## 15. État actuel de l’administration

| Fonction | État |
|---|---|
| Gestion des réservations | Disponible |
| Gestion des prospects | Disponible |
| Gestion des profils clients | Disponible |
| Gestion des devis | Disponible |
| Gestion des lignes de devis | Disponible |
| Gestion des notes | Disponible |
| Gestion des événements | Disponible |
| Gestion des avis | Disponible |
| Création d’événement depuis le frontend | En cours de développement |
| Gestion spécifique des comptes dans `accounts/admin.py` | Non personnalisée actuellement |

---

## Conclusion

Django Admin constitue actuellement l’outil principal de gestion des données Innov'Events.

Il permet déjà de gérer :

- les réservations ;
- les prospects ;
- les profils clients ;
- les devis ;
- les notes ;
- les événements ;
- les avis.

Les fonctions absentes du frontend peuvent temporairement être administrées depuis cette interface, dans la limite des modèles enregistrés et des permissions accordées.