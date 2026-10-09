# Dépôt des images Docker produites par App Hosting à chaque déploiement.
# App Hosting crée ce dépôt s'il n'existe pas ; Terraform le crée en premier pour lui associer
# une règle de nettoyage, afin que le stockage reste dans le quota gratuit (0,5 Go par compte
# de facturation).
#
# Règle : on conserve toujours les 5 images les plus récentes (retour arrière possible),
# les autres sont supprimées une fois âgées de plus de 7 jours.
# Les images des Cloud Functions (dépôt gcf-artifacts) sont déjà nettoyées par firebase deploy.
resource "google_artifact_registry_repository" "apphosting_images" {
  project       = var.project_id
  location      = var.apphosting_region
  repository_id = "firebaseapphosting-images"
  format        = "DOCKER"
  description   = "Images du site (Firebase App Hosting) – nettoyage automatique"

  cleanup_policy_dry_run = false

  cleanup_policies {
    id     = "garder-5-dernieres"
    action = "KEEP"

    most_recent_versions {
      keep_count = 5
    }
  }

  cleanup_policies {
    id     = "supprimer-plus-de-7-jours"
    action = "DELETE"

    condition {
      tag_state  = "ANY"
      older_than = "604800s"
    }
  }

  depends_on = [google_project_service.apis]
}
