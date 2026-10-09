# Déploiement et infrastructure

Tout est décrit dans le dépôt :

| Élément | Où | Déployé par |
|---|---|---|
| Projet Firebase, APIs, Firestore, Auth, App Hosting (backend), comptes de service, fédération GitHub, budget | `infra/terraform/` | workflow **Infrastructure** (`infra.yml`) |
| Règles et index Firestore | `firestore.rules`, `firestore.indexes.json` | workflow **Déploiement** (`deploy.yml`) |
| Fonction de purge RGPD | `functions/` | workflow **Déploiement** |
| Site Next.js | `src/`, `apphosting.yaml` | workflow **Déploiement** (App Hosting, source locale) |
| Contrôles qualité | `ci.yml` | chaque pull request + avant chaque déploiement |

Aucune clé n'est stockée : GitHub Actions s'authentifie auprès de Google Cloud par **Workload Identity Federation**, et seule la branche `main` de `Hellshock666/CabInfCeres` y est autorisée. Les pull requests (y compris depuis des forks, le dépôt étant public) ne peuvent rien déployer.

## Terraform : rien à acheter

Terraform CLI est gratuit et suffit. Terraform Cloud n'est pas utilisé : l'état est stocké dans un bucket Cloud Storage du projet (`gs://cabinet-ceres-tfstate`, versionné, privé), pour un coût de quelques centimes par an au plus.

## Mise en place initiale (une seule fois)

### 1. Passer le projet en forfait Blaze

Console Firebase > ⚙️ > *Utilisation et facturation* > *Détails et paramètres* > **Modifier le forfait** > Blaze, puis associer un compte de facturation.

Coût attendu pour ce site : proche de 0 €. Les quotas gratuits couvrent largement le trafic d'un cabinet (Firestore, Cloud Functions, Cloud Run). Une alerte de budget à 5 €/mois est créée automatiquement. Elle prévient, elle ne bloque pas.

> Ne créez **pas** la base Firestore, l'application Web ni Authentication depuis la console : Terraform s'en charge (sinon il faudra les importer).

### 2. Installer les outils (PowerShell)

```powershell
winget install Google.CloudSDK Hashicorp.Terraform GitHub.cli OpenJS.NodeJS.LTS Git.Git
```

Rouvrez ensuite le terminal.

### 3. Lancer le bootstrap

Depuis la racine du dépôt (`C:\WorkArea\CabInfCeres`) :

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
```

Le script ouvre le navigateur pour les connexions Google et GitHub. Il affiche le plan Terraform (répondez `yes`), configure les variables du dépôt, puis pousse le code sur `main`. Le premier déploiement démarre alors automatiquement : suivez-le dans l'onglet **Actions** de GitHub.

Droits nécessaires pour la personne qui lance le script : **Propriétaire** du projet Google Cloud, **Administrateur de la facturation** sur le compte de facturation (pour l'alerte de budget), **Admin** du dépôt GitHub.

### 4. Créer les comptes infirmiers

```powershell
cd functions
npm run set-nurse -- jean-daniel.fleury@exemple.fr --create
npm run set-nurse -- vincent.barriere@exemple.fr --create
```

Chaque commande affiche un lien à transmettre à l'infirmier pour qu'il choisisse son mot de passe. Pour retirer un accès, utilisez `--revoke`. L'inscription publique est désactivée : seul l'administrateur crée les comptes.

## Au quotidien

- **Modifier le site, les règles ou la fonction** : pull request (la CI vérifie), puis fusion dans `main`, qui déclenche le déploiement automatique.
- **Modifier l'infrastructure** (`infra/terraform`) : fusion dans `main`, qui déclenche un `terraform apply` automatique. Pour un simple aperçu : *Actions > Infrastructure > Run workflow > plan*.
- **Redéployer manuellement** : *Actions > Déploiement > Run workflow* (cibles au choix).
- **Protéger `main`** (recommandé) : *Settings > Branches > Add rule* : pull request obligatoire et CI au vert.
- **Environnement `production`** (optionnel) : *Settings > Environments > production > Required reviewers* pour valider chaque déploiement.

## Plus tard

- **Domaine personnalisé** : console Firebase > App Hosting > backend `web` > *Paramètres > Domaines*. Créez ensuite les enregistrements DNS indiqués chez votre registraire, ajoutez le domaine à `custom_domains` (Terraform) et à `NEXT_PUBLIC_SITE_URL` (`apphosting.yaml`).
- **App Check (anti-spam renforcé)** : clé reCAPTCHA Enterprise, puis `NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY` dans `apphosting.yaml`, puis application d'App Check à Firestore.

## Dépannage

| Symptôme | Cause probable |
|---|---|
| `terraform apply` : *Billing account not found* ou erreur sur Identity Platform | Forfait Blaze non activé |
| `terraform apply` : base Firestore déjà existante | Créée depuis la console : `terraform import google_firestore_database.default "projects/cabinet-ceres/databases/(default)"` |
| Workflow : *Permission denied* lors de l'authentification | Variables GitHub absentes (relancer le bootstrap), ou exécution depuis une autre branche que `main` |
| Déploiement des fonctions : erreur de rôle Cloud Build | Relancer le workflow : la propagation des droits IAM peut prendre quelques minutes après le premier `apply` |
