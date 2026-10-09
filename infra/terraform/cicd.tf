# --- Fédération d'identité GitHub → Google Cloud (aucune clé de compte de service) ---

resource "google_iam_workload_identity_pool" "github" {
  project                   = var.project_id
  workload_identity_pool_id = "github"
  display_name              = "GitHub Actions"

  depends_on = [google_project_service.apis]
}

resource "google_iam_workload_identity_pool_provider" "github" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-oidc"
  display_name                       = "GitHub OIDC"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }

  # Seule la branche principale de ce dépôt peut obtenir des identifiants
  # (les pull requests, y compris depuis des forks, ne peuvent pas déployer).
  attribute_condition = "assertion.repository == \"${var.github_repository}\" && assertion.ref == \"${var.github_deploy_ref}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

locals {
  github_principal = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.github.name}/attribute.repository/${var.github_repository}"
}

# --- Compte de déploiement applicatif (règles, index, fonctions, App Hosting) ---

resource "google_service_account" "deployer" {
  project      = var.project_id
  account_id   = "github-deployer"
  display_name = "GitHub Actions – déploiement applicatif"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "deployer" {
  for_each = toset([
    "roles/artifactregistry.admin",
    "roles/cloudbuild.builds.editor",
    "roles/cloudfunctions.admin",
    "roles/cloudscheduler.admin",
    "roles/datastore.indexAdmin",
    "roles/firebase.viewer",
    "roles/firebaseapphosting.admin",
    "roles/firebaserules.admin",
    "roles/run.admin",
    "roles/serviceusage.serviceUsageConsumer",
    "roles/storage.admin",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.deployer.email}"
}

# Le déployeur doit pouvoir « agir en tant que » les comptes d'exécution.
resource "google_service_account_iam_member" "deployer_act_as_purge" {
  service_account_id = google_service_account.purge_function.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_service_account_iam_member" "deployer_act_as_apphosting" {
  service_account_id = google_service_account.apphosting_runtime.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_service_account_iam_member" "deployer_act_as_compute_default" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${data.google_project.this.number}-compute@developer.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"

  depends_on = [google_project_service.apis]
}

# Firebase CLI vérifie aussi ce droit sur le compte App Engine par défaut avant de déployer
# des Cloud Functions (même si la fonction s'exécute avec son propre compte de service).
resource "google_service_account_iam_member" "deployer_act_as_appspot" {
  service_account_id = "projects/${var.project_id}/serviceAccounts/${var.project_id}@appspot.gserviceaccount.com"
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

resource "google_service_account_iam_member" "deployer_wif" {
  service_account_id = google_service_account.deployer.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.github_principal
}

# --- Compte Terraform (workflow « Infrastructure ») ---

resource "google_service_account" "terraform" {
  project      = var.project_id
  account_id   = "github-terraform"
  display_name = "GitHub Actions – Terraform"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "terraform_owner" {
  project = var.project_id
  role    = "roles/owner"
  member  = "serviceAccount:${google_service_account.terraform.email}"
}

resource "google_service_account_iam_member" "terraform_wif" {
  service_account_id = google_service_account.terraform.name
  role               = "roles/iam.workloadIdentityUser"
  member             = local.github_principal
}
