# Base Firestore (mode natif). Les règles et index sont déployés par firebase-tools
# depuis firestore.rules / firestore.indexes.json (workflow « Déploiement »).
resource "google_firestore_database" "default" {
  provider = google-beta
  project  = var.project_id

  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  # Pas de restauration à un instant T : cohérent avec la purge RGPD à 14 jours.
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_DISABLED"
  delete_protection_state           = "DELETE_PROTECTION_ENABLED"
  deletion_policy                   = "ABANDON"

  depends_on = [google_firebase_project.this]
}
