# Firebase Authentication (Identity Platform) : e-mail / mot de passe uniquement,
# inscription publique désactivée (les comptes infirmiers sont créés par l'administrateur).
resource "google_identity_platform_config" "auth" {
  provider = google-beta
  project  = var.project_id

  sign_in {
    allow_duplicate_emails = false

    email {
      enabled           = true
      password_required = true
    }
  }

  client {
    permissions {
      disabled_user_signup   = true
      disabled_user_deletion = true
    }
  }

  authorized_domains = concat(
    [
      "localhost",
      "${var.project_id}.firebaseapp.com",
      "${var.project_id}.web.app",
      local.apphosting_domain,
    ],
    var.custom_domains,
  )

  depends_on = [google_project_service.apis, google_firebase_project.this]
}
