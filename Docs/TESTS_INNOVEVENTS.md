# Innov'Events — Plan de tests et preuves d'exécution

Ce document présente les tests déjà exécutés sur le projet **Innov'Events**, les preuves disponibles et les scénarios restant à finaliser.

L'objectif est de fournir une vue claire de l'état actuel de la validation sans présenter comme terminées des fonctionnalités encore en cours de développement.

---

## 1. Environnement de test

Les tests ont été réalisés dans l'environnement Docker local du projet.

Services utilisés :

- backend Django ;
- frontend React/Vite ;
- PostgreSQL ;
- MongoDB.

Commande de vérification :

```powershell
cd infra\docker
docker compose ps
```

---

## 2. Tests backend automatisés

Les tests Django sont exécutés dans le conteneur backend.

Commande :

```powershell
docker compose exec backend python manage.py test --verbosity=1
```

### Résultat

- 6 tests exécutés ;
- 6 tests réussis ;
- aucune erreur détectée.

### Tests couverts

| ID | Test | Type | Résultat |
|---|---|---|---|
| BE-01 | Représentation textuelle d'un prospect | Unitaire | Réussi |
| BE-02 | Création publique d'un prospect | API / fonctionnel | Réussi |
| BE-03 | Refus d'un prospect sans email | API / fonctionnel | Réussi |
| BE-04 | Protection de la liste des prospects | Sécurité / API | Réussi |
| BE-05 | Calcul des totaux d'un devis | Unitaire | Réussi |
| BE-06 | Création d'un devis par un administrateur | API / fonctionnel | Réussi |

### Preuve

```text
Docs/captures/tests/backend-tests-success.png
```

---

## 3. Couverture des tests backend

Commandes utilisées :

```powershell
docker compose exec backend coverage erase
docker compose exec backend coverage run --source=. manage.py test --verbosity=1
docker compose exec backend coverage report -m
```

### Résultat

La couverture globale du backend est de :

```text
68 %
```

Le seuil configuré dans l'intégration continue est de :

```text
60 %
```

Le seuil demandé est donc respecté.

### Preuve

```text
Docs/captures/tests/backend-coverage-68.png
```

---

## 4. Contrôles frontend dans la CI

Le frontend est contrôlé automatiquement par GitHub Actions avec les commandes suivantes :

```bash
npm ci
npm run lint
npm run build
```

### Résultats

| Contrôle | Objectif | Résultat |
|---|---|---|
| Installation des dépendances | Vérifier une installation reproductible | Réussi |
| ESLint | Contrôler la qualité du code | Réussi |
| Build Vite | Vérifier que l'application compile | Réussi |

Ces contrôles valident la qualité technique et la compilation du frontend. Ils ne remplacent pas les tests fonctionnels réalisés dans le navigateur.

---

## 5. Tests fonctionnels de connexion

### FE-01 — Connexion avec des identifiants valides

**Objectif :** vérifier qu'un administrateur peut se connecter à l'application.

**Résultat attendu :**

- la connexion est acceptée ;
- l'utilisateur accède à l'espace prévu ;
- aucun message d'erreur n'est affiché.

**Statut :** Réussi.

**Preuve :**

```text
Docs/captures/tests/frontend/login-success.png
```

---

### FE-02 — Connexion avec des identifiants invalides

**Objectif :** vérifier que l'application refuse une connexion incorrecte.

**Résultat attendu :**

- la connexion est refusée ;
- un message d'erreur est affiché ;
- l'utilisateur ne peut pas accéder à l'espace protégé.

**Statut :** Réussi.

**Preuve :**

```text
Docs/captures/tests/frontend/login-error.png
```

---

## 6. Demande de devis et création d'un prospect

Le parcours suivant fait partie des tests fonctionnels prévus :

```text
Formulaire public
→ envoi vers l'API
→ création du prospect
→ vérification dans Django Admin
```

Les captures suivantes peuvent être ajoutées lorsqu'elles sont disponibles :

```text
Docs/captures/tests/frontend/quote-request-success.png
Docs/captures/tests/frontend/quote-request-prospect-created.png
Docs/captures/tests/frontend/quote-request-missing-email.png
```

### Scénarios prévus

| ID | Scénario | Résultat attendu | Statut |
|---|---|---|---|
| FE-03 | Envoi d'une demande de devis valide | La demande est acceptée | En cours de validation |
| E2E-01 | Vérification du prospect dans Django Admin | Le prospect est enregistré avec le statut attendu | En cours de validation |
| FE-04 | Envoi sans email | Le formulaire refuse l'envoi | À finaliser |

---

## 7. Fonctionnalités encore en cours de développement

Certaines fonctions ne sont pas encore disponibles dans l'interface et ne peuvent donc pas être testées complètement.

| ID | Fonction | Statut |
|---|---|---|
| FE-05 | Création d'un événement depuis l'interface | Fonction en cours de développement |
| FE-06 | Modification d'un événement | À finaliser |
| FE-07 | Suppression d'un événement | À finaliser |
| E2E-02 | Parcours complet de réservation | À finaliser |
| E2E-03 | Gestion complète d'un devis | À finaliser |
| MOB-01 | Tests fonctionnels de l'application mobile | À finaliser |

Ces scénarios seront complétés après la finalisation des fonctionnalités correspondantes.

---

## 8. État global actuel

| Domaine | État |
|---|---|
| Tests backend automatisés | Terminés |
| Couverture backend | Terminée — 68 % |
| CI backend | Opérationnelle |
| CI frontend | Opérationnelle |
| Connexion valide | Testée |
| Connexion invalide | Testée |
| Demande de devis | En cours de validation |
| Création d'événement | Fonction en cours de développement |
| Tests end-to-end complets | À finaliser |
| Tests mobiles | À finaliser |

---

## 9. Limites actuelles

Le plan de tests est encore en cours de finalisation.

Les résultats présentés comme réussis correspondent uniquement aux tests réellement exécutés et aux preuves disponibles.

Les fonctionnalités non terminées ne sont pas déclarées comme validées. Elles sont identifiées dans ce document avec les statuts :

- `En cours de validation` ;
- `À finaliser` ;
- `Fonction en cours de développement`.

---

## 10. Conclusion

À ce stade :

- les tests backend automatisés sont réussis ;
- la couverture backend atteint 68 % ;
- le seuil de couverture de la CI est respecté ;
- le lint et le build frontend sont validés ;
- les scénarios de connexion valide et invalide sont validés ;
- les autres tests fonctionnels et end-to-end seront complétés après la finalisation des fonctionnalités restantes.

Ce document sera mis à jour au fur et à mesure de l'avancement du projet.