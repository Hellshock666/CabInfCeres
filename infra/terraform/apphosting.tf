locals {
  apphosting_domain = "${var.apphosting_backend_id}--${var.project_id}.${var.apphosting_region}.hosted.app"
}

# Compte de service d'exécution (build Cloud Build + runtime Cloud Run) d'App Hosting.
resource "google_service_account" "apphosting_runtime" {
  project      = var.project_id
  account_id   = "apphosting-runtime"
  display_name = "App Hosting – runtime du site"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "apphosting_runtime" {
  project = var.project_id
  role    = "roles/firebaseapphosting.computeRunner"
  member  = "serviceAccount:${google_service_account.apphosting_runtime.email}"
}

# Backend App Hosting sans dépôt connecté : le code est déployé par GitHub Actions
# (`firebase deploy --only apphosting`), ce qui garde tout le pilotage dans le dépôt.
resource "google_firebase_app_hosting_backend" "web" {
  provider = google-beta
  project  = var.project_id

  location         = var.apphosting_region
  backend_id       = var.apphosting_backend_id
  app_id           = google_firebase_web_app.site.app_id
  serving_locality = "GLOBAL_ACCESS"
  service_account  = google_service_account.apphosting_runtime.email

  depends_on = [
    google_project_service.apis,
    google_project_iam_member.apphosting_runtime,
  ]
}

# Compte « par défaut » d'App Hosting. Le CLI Firebase (firebase deploy --only apphosting)
# vérifie sa présence et tente de le créer s'il manque ; le compte de déploiement GitHub n'ayant
# volontairement pas le droit de créer des comptes de service, Terraform le crée à l'avance.
resource "google_service_account" "apphosting_default" {
  project      = var.project_id
  account_id   = "firebase-app-hosting-compute"
  display_name = "Firebase App Hosting compute service account"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "apphosting_default" {
  project = var.project_id
  role    = "roles/firebaseapphosting.computeRunner"
  member  = "serviceAccount:${google_service_account.apphosting_default.email}"
}

resource "google_service_account_iam_member" "deployer_act_as_apphosting_default" {
  service_account_id = google_service_account.apphosting_default.name
  role               = "roles/iam.serviceAccountUser"
  member             = "serviceAccount:${google_service_account.deployer.email}"
}

# Rôles que le CLI Firebase attribue à ce compte lors d'un déploiement App Hosting depuis
# une source locale : déclarés ici pour que l'état IAM du projet reste décrit dans le dépôt.
resource "google_project_iam_member" "apphosting_default_extra" {
  for_each = toset([
    "roles/developerconnect.readTokenAccessor",
    "roles/firebase.sdkAdminServiceAgent",
    "roles/storage.objectViewer",
  ])

  project = var.project_id
  role    = each.value
  member  = "serviceAccount:${google_service_account.apphosting_default.email}"
}
