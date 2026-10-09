variable "project_id" {
  description = "Identifiant du projet Google Cloud / Firebase."
  type        = string
  default     = "cabinet-ceres"
}

variable "region" {
  description = "Région par défaut (Cloud Functions, Cloud Scheduler)."
  type        = string
  default     = "europe-west1"
}

variable "firestore_location" {
  description = "Emplacement de la base Firestore (non modifiable après création). eur3 = multirégion Europe."
  type        = string
  default     = "eur3"
}

variable "apphosting_region" {
  description = "Région Firebase App Hosting (régions disponibles en Europe : europe-west4)."
  type        = string
  default     = "europe-west4"
}

variable "apphosting_backend_id" {
  description = "Identifiant du backend App Hosting (apparaît dans l'URL <id>--<projet>.<région>.hosted.app)."
  type        = string
  default     = "web"
}

variable "github_repository" {
  description = "Dépôt GitHub autorisé à déployer via Workload Identity Federation (owner/repo)."
  type        = string
  default     = "Hellshock666/CabInfCeres"
}

variable "github_deploy_ref" {
  description = "Seule branche autorisée à obtenir des identifiants Google depuis GitHub Actions."
  type        = string
  default     = "refs/heads/main"
}

variable "billing_account_id" {
  description = "Compte de facturation (format XXXXXX-XXXXXX-XXXXXX) pour l'alerte de budget. Vide = pas de budget."
  type        = string
  default     = ""
}

variable "budget_amount" {
  description = "Montant mensuel de l'alerte de budget."
  type        = number
  default     = 5
}

variable "budget_currency" {
  description = "Devise du compte de facturation."
  type        = string
  default     = "EUR"
}

variable "custom_domains" {
  description = "Domaines personnalisés à autoriser pour la connexion Firebase Auth (ex. [\"www.mon-domaine.fr\"])."
  type        = list(string)
  default     = []
}
