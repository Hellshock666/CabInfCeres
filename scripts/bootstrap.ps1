<#
.SYNOPSIS
  Mise en place initiale (une seule fois) : infrastructure Terraform, variables GitHub, premier push.

.DESCRIPTION
  À exécuter depuis la racine du dépôt, sur le poste de l'administrateur, APRÈS le passage
  du projet Firebase au forfait Blaze. Le script est idempotent : il peut être relancé.

  Étapes :
    1. Vérifie les outils (gcloud, terraform, gh, node, git)
    2. Connexion Google Cloud (navigateur) + projet par défaut
    3. Vérifie que la facturation (Blaze) est active et récupère le compte de facturation
    4. Crée le bucket d'état Terraform (versionné, privé)
    5. terraform init + apply (affiche le plan et demande confirmation)
    6. Renseigne les variables / secret du dépôt GitHub utilisés par les workflows
    7. Installe les dépendances (génère les package-lock.json) puis pousse le code sur main

.EXAMPLE
  powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1
#>
[CmdletBinding()]
param(
  [string]$ProjectId = "cabinet-ceres",
  [string]$GitHubRepo = "Hellshock666/CabInfCeres",
  # Compte GitHub à utiliser (utile quand plusieurs comptes sont enregistrés sur le poste).
  [string]$GitHubUser = "Hellshock666",
  [string]$StateBucketLocation = "europe-west1",
  [switch]$SkipPush
)

# « Continue » et non « Stop » : gcloud (gcloud.ps1) et terraform écrivent des messages normaux
# sur stderr, que Windows PowerShell transformerait en erreurs bloquantes. Les échecs réels sont
# détectés par le code de retour ($LASTEXITCODE) dans Exec / Test-Native.
$ErrorActionPreference = "Continue"
Set-Location (Split-Path $PSScriptRoot -Parent)

function Step([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }

# Exécute une commande native et s'arrête si elle échoue (PowerShell 5.1 ne le fait pas seul).
function Exec([scriptblock]$Command) {
  $global:LASTEXITCODE = 0
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "Échec de la commande : $Command" }
}

# Teste une commande sans afficher sa sortie ni ses erreurs (ex. « suis-je déjà connecté ? »).
function Test-Native([scriptblock]$Command) {
  $global:LASTEXITCODE = 0
  try { & $Command *> $null } catch { return $false }
  return ($LASTEXITCODE -eq 0)
}

function Require([string]$Name, [string]$Install) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "« $Name » est introuvable. Installation : $Install (puis rouvrir le terminal)."
  }
}

# --- 1. Outils -------------------------------------------------------------------------------
Step "Vérification des outils"
Require "gcloud"    "winget install Google.CloudSDK"
Require "terraform" "winget install Hashicorp.Terraform"
Require "gh"        "winget install GitHub.cli"
Require "node"      "winget install OpenJS.NodeJS.LTS"
Require "git"       "winget install Git.Git"

# Terraform >= 1.6 requis (blocs « import » paramétrés). Un ancien terraform.exe peut masquer
# la version installée par winget s'il apparaît plus tôt dans le PATH.
$tfVersion = [version]((terraform version -json | ConvertFrom-Json).terraform_version)
if ($tfVersion -lt [version]"1.6.0") {
  $tfPaths = (where.exe terraform) -join ", "
  throw "Terraform $tfVersion trouvé ($tfPaths) : version 1.6 minimum requise. Lancez « winget upgrade Hashicorp.Terraform » (ou supprimez l'ancien terraform.exe du PATH), rouvrez le terminal puis relancez le script."
}
Write-Host "Terraform $tfVersion"

# --- 2. Google Cloud -------------------------------------------------------------------------
Step "Connexion Google Cloud"
$active = gcloud auth list --filter="status:ACTIVE" --format="value(account)"
if (-not $active) { Exec { gcloud auth login } }
if (-not (Test-Native { gcloud auth application-default print-access-token })) {
  Exec { gcloud auth application-default login }
}
Exec { gcloud config set project $ProjectId }
Exec { gcloud auth application-default set-quota-project $ProjectId }

# --- 3. Facturation ----------------------------------------------------------------------------
Step "Vérification du forfait Blaze"
$billingEnabled = gcloud billing projects describe $ProjectId --format="value(billingEnabled)"
if ($billingEnabled -ne "True") {
  throw "La facturation n'est pas active sur $ProjectId. Console Firebase > Paramètres > Utilisation et facturation > Modifier le forfait > Blaze, puis relancer ce script."
}
$billingAccountId = (gcloud billing projects describe $ProjectId --format="value(billingAccountName)") -replace "^billingAccounts/", ""
Write-Host "Compte de facturation : $billingAccountId"

Exec { gcloud services enable cloudresourcemanager.googleapis.com serviceusage.googleapis.com iam.googleapis.com storage.googleapis.com cloudbilling.googleapis.com billingbudgets.googleapis.com --project $ProjectId }

# --- 4. Bucket d'état Terraform --------------------------------------------------------------
$stateBucket = "$ProjectId-tfstate"
Step "Bucket d'état Terraform : gs://$stateBucket"
if (-not (Test-Native { gcloud storage buckets describe "gs://$stateBucket" })) {
  Exec { gcloud storage buckets create "gs://$stateBucket" --project $ProjectId --location $StateBucketLocation --uniform-bucket-level-access --public-access-prevention }
  Exec { gcloud storage buckets update "gs://$stateBucket" --versioning }
}

# --- 5. Terraform ------------------------------------------------------------------------------
Step "Terraform (le plan s'affiche, répondez « yes » pour appliquer)"
Push-Location "infra/terraform"
try {
  Exec { terraform init -input=false -backend-config="bucket=$stateBucket" }
  Exec { terraform apply -var "project_id=$ProjectId" -var "billing_account_id=$billingAccountId" -var "github_repository=$GitHubRepo" }
  $tf = terraform output -json | ConvertFrom-Json
} finally {
  Pop-Location
}

# --- 6. GitHub -------------------------------------------------------------------------------
Step "Configuration du dépôt GitHub $GitHubRepo"
# Plusieurs comptes GitHub peuvent être enregistrés : on bascule temporairement sur $GitHubUser,
# puis on rétablit le compte actif d'origine à la fin du script.
$previousGhUser = $null
if (Test-Native { gh auth status --hostname github.com }) {
  $previousGhUser = (gh api user --jq .login 2>$null)
}
if ($previousGhUser -ne $GitHubUser) {
  if (-not (Test-Native { gh auth switch --hostname github.com --user $GitHubUser })) {
    Write-Host "Connexion à GitHub : choisissez le compte $GitHubUser dans le navigateur." -ForegroundColor Yellow
    Exec { gh auth login --hostname github.com --git-protocol https --web }
  }
}
$currentGhUser = (gh api user --jq .login 2>$null)
if ($currentGhUser -ne $GitHubUser) {
  throw "Compte GitHub actif : « $currentGhUser » au lieu de « $GitHubUser ». Lancez « gh auth login » avec le bon compte puis relancez le script."
}
Write-Host "Compte GitHub utilisé : $currentGhUser"

$variables = [ordered]@{
  GCP_PROJECT_ID   = $ProjectId
  GCP_WIF_PROVIDER = $tf.workload_identity_provider.value
  GCP_DEPLOY_SA    = $tf.deployer_service_account.value
  GCP_TERRAFORM_SA = $tf.terraform_service_account.value
  TF_STATE_BUCKET  = $stateBucket
  SITE_URL         = $tf.apphosting_url.value
}
foreach ($name in $variables.Keys) {
  Exec { gh variable set $name --repo $GitHubRepo --body $variables[$name] }
}
# Secret (masqué dans les journaux publics des workflows)
Exec { gh secret set GCP_BILLING_ACCOUNT_ID --repo $GitHubRepo --body $billingAccountId }

# --- 7. Dépendances + premier push ----------------------------------------------------------
# Workflows GitHub livrés hors de .github (dossier protégé en écriture à distance) : mise en place.
if (Test-Path "scripts/github") {
  New-Item -ItemType Directory -Force ".github/workflows" | Out-Null
  Copy-Item "scripts/github/dependabot.yml" ".github/dependabot.yml" -Force
  Copy-Item "scripts/github/workflows/*.yml" ".github/workflows/" -Force
  Remove-Item "scripts/github" -Recurse -Force
}

# Fichier obsolète laissé par une version précédente du site.
Remove-Item "src/components/landing/ServiceZone.tsx" -ErrorAction SilentlyContinue

Step "Installation des dépendances (génère les package-lock.json)"
Exec { npm install }
Exec { npm --prefix functions install }

if ($SkipPush) {
  Write-Host "Push ignoré (-SkipPush)." -ForegroundColor Yellow
} else {
  Step "Publication du code sur GitHub (branche main)"
  if (-not (Test-Path ".git")) { Exec { git init -b main } }

  # Identité des commits limitée à ce dépôt (n'altère pas votre configuration Git globale) :
  # adresse « noreply » GitHub du compte, pour ne pas exposer d'e-mail dans un dépôt public.
  $ghId = (gh api user --jq .id 2>$null)
  Exec { git config --local user.name $GitHubUser }
  Exec { git config --local user.email "$ghId+$GitHubUser@users.noreply.github.com" }

  # Le nom d'utilisateur dans l'URL permet au Git Credential Manager de choisir le bon compte
  # lors des push suivants, même avec plusieurs comptes GitHub sur le poste.
  $remoteUrl = "https://$GitHubUser@github.com/$GitHubRepo.git"
  if (Test-Native { git remote get-url origin }) {
    Exec { git remote set-url origin $remoteUrl }
  } else {
    Exec { git remote add origin $remoteUrl }
  }
  Exec { git add -A }
  if (-not (Test-Native { git diff --cached --quiet })) {
    Exec { git commit -m "Initialisation : site, infrastructure Terraform et CI/CD" }
  }
  # Push authentifié par le jeton gh du compte $GitHubUser (uniquement pour cette commande).
  Exec { git -c credential.helper= -c "credential.helper=!gh auth git-credential" push -u origin main }
}

if ($previousGhUser -and $previousGhUser -ne $GitHubUser) {
  Exec { gh auth switch --hostname github.com --user $previousGhUser }
  Write-Host "Compte GitHub actif rétabli : $previousGhUser"
}

Write-Host "`nTerminé." -ForegroundColor Green
Write-Host "Suivi du déploiement : https://github.com/$GitHubRepo/actions"
Write-Host "Site (après le premier déploiement) : $($tf.apphosting_url.value)"
Write-Host "Créer un compte infirmier : cd functions ; npm run set-nurse -- prenom.nom@exemple.fr --create"
