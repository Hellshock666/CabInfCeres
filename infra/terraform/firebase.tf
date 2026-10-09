# Le projet Firebase a été créé depuis la console : il est importé dans l'état Terraform.
import {
  to = google_firebase_project.this
  id = "projects/${var.project_id}"
}

resource "google_firebase_project" "this" {
  provider = google-beta
  project  = var.project_id

  depends_on = [google_project_service.apis]
}

# Application Web Firebase (fournit la configuration client injectée par App Hosting).
resource "google_firebase_web_app" "site" {
  provider     = google-beta
  project      = var.project_id
  display_name = "Site Cabinet Cérès"

  deletion_policy = "DELETE"

  depends_on = [google_firebase_project.this]
}
