output "project_number" {
  value = data.google_project.this.number
}

output "web_app_id" {
  value = google_firebase_web_app.site.app_id
}

output "apphosting_url" {
  description = "URL publique du site."
  value       = "https://${local.apphosting_domain}"
}

output "workload_identity_provider" {
  description = "À renseigner dans la variable GitHub GCP_WIF_PROVIDER."
  value       = google_iam_workload_identity_pool_provider.github.name
}

output "deployer_service_account" {
  value = google_service_account.deployer.email
}

output "terraform_service_account" {
  value = google_service_account.terraform.email
}

output "uptime_check_id" {
  description = "Identifiant du test de disponibilité (Cloud Monitoring)."
  value       = google_monitoring_uptime_check_config.site.uptime_check_id
}
