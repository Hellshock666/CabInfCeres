# Compte de service dédié à la fonction de purge RGPD (moindre privilège : Firestore uniquement).
resource "google_service_account" "purge_function" {
  project      = var.project_id
  account_id   = "purge-function"
  display_name = "Cloud Function – purge RGPD des demandes"

  depends_on = [google_project_service.apis]
}

resource "google_project_iam_member" "purge_function_firestore" {
  project = var.project_id
  role    = "roles/datastore.user"
  member  = "serviceAccount:${google_service_account.purge_function.email}"
}

# Les builds Cloud Functions (2e gén.) s'exécutent avec le compte de service Compute par défaut,
# qui n'a plus ces rôles automatiquement sur les projets récents.
locals {
  compute_default_sa = "serviceAccount:${data.google_project.this.number}-compute@developer.gserviceaccount.com"
}

resource "google_project_iam_member" "compute_default_build" {
  for_each = toset([
    "roles/cloudbuild.builds.builder",
    "roles/logging.logWriter",
    "roles/artifactregistry.writer",
  ])

  project = var.project_id
  role    = each.value
  member  = local.compute_default_sa

  depends_on = [google_project_service.apis]
}
