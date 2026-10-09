# Test de disponibilité du site public (Cloud Monitoring).
# 3 régions × 1 requête toutes les 5 min ≈ 26 000 requêtes/mois : dans la gratuité de Cloud
# Monitoring et d'App Hosting. Les résultats alimentent la page /admin/stats
# (lus par la fonction planifiée, voir functions/src/index.ts → refreshUptime).
resource "google_monitoring_uptime_check_config" "site" {
  project      = var.project_id
  display_name = "Site public – ${local.apphosting_domain}"
  timeout      = "10s"
  period       = "300s"

  http_check {
    path           = "/"
    port           = 443
    use_ssl        = true
    validate_ssl   = true
    request_method = "GET"

    accepted_response_status_codes {
      status_class = "STATUS_CLASS_2XX"
    }
  }

  monitored_resource {
    type = "uptime_url"
    labels = {
      project_id = var.project_id
      host       = local.apphosting_domain
    }
  }

  # Minimum 3 régions de test.
  selected_regions = ["EUROPE", "USA_VIRGINIA", "USA_OREGON"]

  depends_on = [google_project_service.apis]
}

# La fonction planifiée lit les résultats du test (lecture seule).
resource "google_project_iam_member" "purge_function_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.viewer"
  member  = "serviceAccount:${google_service_account.purge_function.email}"
}
