# Innov'Events — Guide utilisateur

Ce guide explique comment utiliser les fonctionnalités actuellement accessibles dans l'application web **Innov'Events**.

Les fonctionnalités encore en cours de développement ou non reliées à une adresse sont signalées clairement.

---

## 1. Accéder à l'application

Après le démarrage de l'environnement local, ouvrir :

```text
http://localhost:5173
```

La page d'accueil est accessible à l'adresse :

```text
/
```

---

## 2. Pages publiques

Les pages suivantes sont accessibles sans connexion.

| Page | Adresse |
|---|---|
| Accueil | `/` |
| Demande de devis | `/demande-de-devis` |
| Connexion | `/login` |
| Inscription | `/signup` |
| Événements | `/evenements` |
| Contact | `/contact` |
| Avis | `/avis` |
| Mentions légales | `/mentions-legales` |

---

## 3. Accueil

La page d'accueil présente l'application Innov'Events et permet d'accéder aux principales rubriques.

Adresse :

```text
http://localhost:5173/
```

Depuis cette page, l'utilisateur peut notamment accéder :

- à la connexion ;
- à l'inscription ;
- à la demande de devis ;
- aux événements ;
- aux avis ;
- au formulaire de contact ;
- aux mentions légales.

---

## 4. Créer un compte

Ouvrir :

```text
http://localhost:5173/signup
```

Renseigner les informations demandées dans le formulaire, puis valider l'inscription.

Après la création du compte, l'utilisateur peut se connecter depuis la page de connexion.

Cette fonction dépend des contrôles et validations actuellement présents dans le formulaire.

---

## 5. Se connecter

Ouvrir :

```text
http://localhost:5173/login
```

Saisir :

- le nom d'utilisateur ;
- le mot de passe.

Puis valider le formulaire.

### Connexion réussie

Lorsque les identifiants sont corrects, l'utilisateur accède à l'espace correspondant à son rôle.

### Connexion refusée

Lorsque les identifiants sont incorrects :

- la connexion est refusée ;
- un message d'erreur est affiché ;
- l'utilisateur ne peut pas accéder aux pages protégées.

---

## 6. Demander un devis

Ouvrir :

```text
http://localhost:5173/demande-de-devis
```

Compléter le formulaire avec les informations demandées, puis envoyer la demande.

Le parcours attendu est :

```text
Formulaire de demande
→ envoi vers l'API
→ création d'un prospect
→ traitement par un administrateur
```

Les informations obligatoires doivent être renseignées. Une demande incomplète peut être refusée par le formulaire ou par l'API.

---

## 7. Consulter les événements

Ouvrir :

```text
http://localhost:5173/evenements
```

Cette page permet de consulter les événements disponibles.

La création, la modification et la suppression d'événements depuis l'interface sont encore en cours de finalisation.

---

## 8. Consulter les avis

Ouvrir :

```text
http://localhost:5173/avis
```

Cette page présente la partie consacrée aux avis.

Les fonctions exactes disponibles dépendent de l'état actuel de développement de cette page.

---

## 9. Contacter Innov'Events

Ouvrir :

```text
http://localhost:5173/contact
```

Cette page permet d'accéder aux informations ou au formulaire de contact de l'application.

Ne pas saisir de données personnelles réelles lors des tests de démonstration.

---

## 10. Consulter les mentions légales

Ouvrir :

```text
http://localhost:5173/mentions-legales
```

Cette page présente les informations légales liées à l'application.

---

## 11. Espace client

L'espace client est protégé.

Adresse :

```text
http://localhost:5173/client
```

L'accès est réservé aux utilisateurs reconnus comme clients par l'application.

Lorsqu'un utilisateur non autorisé tente d'accéder à cette page, le système de protection des routes doit empêcher l'accès.

La page correspondante est :

```text
ClientAccountPage.jsx
```

---

## 12. Espace administrateur

L'espace administrateur est protégé.

Adresse :

```text
http://localhost:5173/admin
```

L'accès est réservé aux utilisateurs appartenant au personnel ou disposant du rôle nécessaire.

La protection est assurée par :

```text
StaffOnlyRoute
```

L'administration Django reste également accessible à l'adresse :

```text
http://localhost:8000/admin
```

Elle permet notamment de gérer les données et les comptes selon les modèles enregistrés dans Django Admin.

---

## 13. Rôles et accès

| Espace | Accès |
|---|---|
| Pages publiques | Tous les visiteurs |
| Espace client `/client` | Utilisateurs clients |
| Espace administrateur `/admin` | Personnel ou administrateurs |
| Django Admin | Superutilisateurs ou comptes autorisés |

Les droits réels sont déterminés par le backend et par les protections de routes du frontend.

---

## 14. Pages présentes mais non encore reliées

Deux fichiers de pages existent actuellement sans route déclarée dans `App.jsx`.

### Mot de passe oublié

Fichier :

```text
ForgotPasswordPage.jsx
```

Aucune route n'est actuellement déclarée pour cette page.

Elle ne doit donc pas être présentée comme une fonction complètement accessible tant que son adresse n'a pas été ajoutée.

### Espace employé

Fichier :

```text
EmployeePage.jsx
```

Aucune route n'est actuellement déclarée pour cette page.

L'espace employé est donc considéré comme en cours d'intégration.

---

## 15. Fonctions encore en cours de finalisation

Les fonctions suivantes ne sont pas déclarées comme complètement terminées dans ce guide :

- création d'un événement depuis l'interface ;
- modification d'un événement ;
- suppression d'un événement ;
- parcours complet de réservation ;
- gestion complète des devis ;
- accès à la page de mot de passe oublié ;
- accès à l'espace employé ;
- certaines fonctions de l'application mobile.

Elles seront ajoutées au guide après leur finalisation et leur validation.

---

## 16. En cas de problème de connexion

Vérifier d'abord que les conteneurs sont actifs :

```powershell
cd infra\docker
docker compose ps
```

Vérifier les comptes Django existants :

```powershell
docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; U=get_user_model(); print(list(U.objects.values('username','email','is_staff','is_superuser','is_active')))"
```

Réinitialiser le mot de passe du compte administrateur local :

```powershell
docker compose exec backend python manage.py changepassword admin
```

Le mot de passe local est différent du mot de passe utilisé sur la version déployée.

---

## 17. Déconnexion

Lorsqu'un bouton de déconnexion est présent dans l'espace connecté, l'utilisateur doit l'utiliser à la fin de sa session.

Après la déconnexion :

- les données de session doivent être supprimées ;
- l'accès aux pages protégées doit être refusé ;
- l'utilisateur doit se reconnecter pour accéder à son espace.

---

## 18. État actuel du guide

| Fonction | État |
|---|---|
| Accueil | Accessible |
| Inscription | Accessible |
| Connexion | Accessible et testée |
| Demande de devis | Accessible |
| Liste des événements | Accessible |
| Avis | Accessible |
| Contact | Accessible |
| Mentions légales | Accessible |
| Espace client | Route protégée disponible |
| Espace administrateur | Route protégée disponible |
| Mot de passe oublié | Page présente, route manquante |
| Espace employé | Page présente, route manquante |
| Création d'événement | En cours de développement |

---

## Conclusion

Le guide décrit uniquement les pages confirmées dans la configuration actuelle du frontend.

Les fonctions non terminées ou non accessibles ne sont pas présentées comme opérationnelles. Ce document devra être mis à jour après l'ajout des routes et la finalisation des fonctions restantes.