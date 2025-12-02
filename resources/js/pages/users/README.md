# Module de Gestion des Utilisateurs

## 📁 Structure des fichiers

```
users/
├── Index.tsx                          # Page principale (liste des utilisateurs)
├── Create.tsx                         # Formulaire création/édition
├── types.ts                           # Définitions TypeScript
├── config.ts                          # Configuration et constantes
├── helpers.ts                         # Fonctions utilitaires
├── validation.ts                      # Validation des formulaires
├── components/
│   ├── StatsCards.tsx                 # Cartes de statistiques
│   ├── FiltersCard.tsx                # Filtres de recherche
│   ├── UsersTable.tsx                 # Tableau des utilisateurs
│   └── ConfirmationDialogs.tsx        # Dialogues de confirmation
└── README.md                          # Cette documentation
```

## 🎯 Rôles utilisateurs

### Définition des rôles
- **Super Admin** (`super_admin`) : Accès complet à tous les districts et fonctionnalités
- **Utilisateur Central** (`central_user`) : Peut créer, modifier et consulter dans tous les districts (sans permissions admin)
- **Admin District** (`admin_district`) : Gestion complète d'un district spécifique
- **Utilisateur District** (`user_district`) : Saisie et consultation dans un district

### Règles d'affectation
- `super_admin` et `central_user` → **Pas de district** (accès global)
- `admin_district` et `user_district` → **District obligatoire**

## 🔧 Configuration

### Fichier `config.ts`
Contient toutes les configurations centralisées :
- Badges de rôles (variants, labels, descriptions)
- Configuration des statuts
- Labels des permissions
- Paramètres de pagination
- Délais de debounce pour la recherche
- Messages de confirmation et succès

### Fichier `types.ts`
Définit tous les types TypeScript :
- `UserRole` : Type littéral pour les rôles
- `UserStatus` : 'active' | 'inactive'
- `User` : Interface complète d'un utilisateur
- `UserStats` : Statistiques globales
- `UserFilters` : Filtres de recherche
- `PaginatedUsers` : Données paginées

## 🛠️ Helpers

### Fonctions principales (`helpers.ts`)

#### Validation de rôles
```typescript
requiresDistrict(role: UserRole): boolean
hasGlobalAccess(role: UserRole): boolean
```

#### Formatage
```typescript
formatDate(dateString: string): string
formatDateTime(dateString: string): string
formatUserName(name: string): string
getInitials(name: string): string
```

#### Filtres
```typescript
hasActiveFilters(filters: UserFilters): boolean
buildSearchParams(filters: UserFilters): Record<string, string>
clearAllFilters(): UserFilters
```

#### Permissions
```typescript
canModifyUser(targetUser, currentUser, targetUserDistrict?): boolean
```

## ✅ Validation

### Fichier `validation.ts`

#### Validation du formulaire
```typescript
validateUserForm(data: UserFormData, isEdit: boolean): ValidationError[]
```

#### Validation du mot de passe
```typescript
validatePassword(password: string): ValidationError[]
calculatePasswordStrength(password: string): { score, label, color }
```

#### Règles de validation
- **Nom** : 3-255 caractères
- **Email** : Format valide
- **Mot de passe** : 
  - Minimum 8 caractères
  - Au moins 1 majuscule
  - Au moins 1 minuscule
  - Au moins 1 chiffre
- **Rôle** : Obligatoire
- **District** : Obligatoire pour `admin_district` et `user_district`

## 🎨 Composants

### StatsCards.tsx
Affiche 4 cartes de statistiques :
- Total utilisateurs (avec pourcentage actifs)
- Super Admins
- Utilisateurs Centraux
- Utilisateurs District (admins + users)

### FiltersCard.tsx
Filtres de recherche avec debounce automatique :
- Recherche par nom/email
- Filtre par rôle
- Filtre par district
- Filtre par statut
- Bouton de réinitialisation

### UsersTable.tsx
Tableau responsive avec :
- Avatar coloré avec initiales
- Badge de rôle
- Localisation complète
- Badge de statut
- Menu d'actions (Modifier, Activer/Désactiver, Supprimer)

### ConfirmationDialogs.tsx
Deux dialogues de confirmation :
- **ToggleStatusDialog** : Activer/Désactiver avec avertissement
- **DeleteUserDialog** : Suppression avec détails des conséquences

## 🔄 Flux de données

### Recherche automatique
1. L'utilisateur tape dans un champ de filtre
2. Debounce de 500ms
3. Construction des paramètres de recherche
4. Requête Inertia avec `preserveState` et `preserveScroll`
5. Mise à jour de la liste sans rechargement complet

### Création/Modification
1. Formulaire validé côté client (`validation.ts`)
2. Envoi au serveur via Inertia
3. Validation serveur (`UserManagementController`)
4. Transaction DB avec rollback en cas d'erreur
5. Log de l'action
6. Redirection avec message de succès

### Actions utilisateur
- **Toggle Status** : POST `/users/{id}/toggle-status`
- **Delete** : DELETE `/users/{id}`
- **Reset Password** : POST `/users/{id}/reset-password`

## 🔐 Sécurité

### Contrôles d'accès
- Middleware `district.access:manage_users`
- Vérification des permissions dans le contrôleur
- Admin district : accès uniquement à son district
- Super admin : accès complet

### Protection
- Hash des mots de passe (bcrypt)
- Validation stricte des entrées
- Protection CSRF (Laravel)
- Logs de toutes les actions sensibles

## 📊 Backend (PHP)

### Contrôleur : `UserManagementController.php`

#### Routes disponibles
```php
GET    /users              → index()
GET    /users/create       → create()
POST   /users              → store()
GET    /users/{id}/edit    → edit()
PUT    /users/{id}         → update()
POST   /users/{id}/toggle-status → toggleStatus()
DELETE /users/{id}         → destroy()
POST   /users/{id}/reset-password → resetPassword()
```

#### Méthodes principales

**index()** : Liste avec filtres
- Scope par district si admin district
- Filtres : role, district, status, search
- Pagination : 15 par page
- Stats globales

**store()** : Création
- Validation des données
- Vérification cohérence role/district
- Transaction DB
- Log de création

**update()** : Modification
- Vérification propriétaire/permissions
- Protection dernier super admin
- Validation cohérence role/district
- Log des modifications

**destroy()** : Suppression
- Réservé aux super admins
- Vérification des données liées (dossiers, propriétés)
- Protection dernier super admin

## 🧪 Tests recommandés

### Tests unitaires
- Validation des helpers
- Calcul de force de mot de passe
- Construction des paramètres de recherche
- Formatage des dates

### Tests d'intégration
- Création d'utilisateur par rôle
- Filtrage et recherche
- Pagination
- Actions (toggle, delete)

### Tests E2E
- Parcours complet de création
- Modification avec changement de rôle
- Désactivation/Réactivation
- Suppression avec confirmation

## 📝 Conventions de code

### Nommage
- **Composants** : PascalCase (`StatsCards.tsx`)
- **Fonctions** : camelCase (`buildSearchParams`)
- **Constantes** : UPPER_SNAKE_CASE (`ROLE_SUPER_ADMIN`)
- **Types** : PascalCase (`UserRole`, `UserFilters`)

### Organisation
- Un composant par fichier
- Exports nommés pour les helpers
- Export default pour les composants React
- Types groupés dans `types.ts`

### Documentation
- JSDoc pour les fonctions complexes
- Commentaires pour la logique métier
- Types TypeScript explicites

## 🚀 Améliorations futures

### Fonctionnalités
- [ ] Gestion des permissions granulaires dans l'UI
- [ ] Upload d'avatar utilisateur
- [ ] Historique d'activité détaillé
- [ ] Export des utilisateurs (CSV, Excel)
- [ ] Actions en masse (activation/désactivation multiple)
- [ ] Filtres avancés (par province, région)
- [ ] Notifications par email (création, modification)

### Performance
- [ ] Mise en cache des statistiques
- [ ] Lazy loading des composants lourds
- [ ] Optimisation des requêtes N+1
- [ ] Pagination infinie optionnelle

### UX
- [ ] Tri des colonnes du tableau
- [ ] Recherche par CIN
- [ ] Vue grille/liste
- [ ] Dark mode complet
- [ ] Raccourcis clavier

## 📞 Support

Pour toute question ou problème :
1. Vérifier cette documentation
2. Consulter les types dans `types.ts`
3. Examiner les logs Laravel
4. Tester les validations côté client

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024