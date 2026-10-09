# Alerte de budget mensuelle (e-mail aux administrateurs de facturation à 50 %, 90 % et 100 %).
# Une alerte ne bloque pas la consommation : elle prévient.
resource "google_billing_budget" "monthly" {
  count = var.billing_account_id == "" ? 0 : 1

  billing_account = var.billing_account_id
  display_name    = "${var.project_id} – budget mensuel"

  budget_filter {
    projects = ["projects/${data.google_project.this.number}"]
  }

  amount {
    specified_amount {
      currency_code = var.budget_currency
      units         = tostring(var.budget_amount)
    }
  }

  threshold_rules {
    threshold_percent = 0.5
  }
  threshold_rules {
    threshold_percent = 0.9
  }
  threshold_rules {
    threshold_percent = 1.0
  }
  threshold_rules {
    threshold_percent = 1.0
    spend_basis       = "FORECASTED_SPEND"
  }

  depends_on = [google_project_service.apis]
}

# Permet au compte Terraform de la CI de gérer ce budget.
resource "google_billing_account_iam_member" "terraform_budgets" {
  count = var.billing_account_id == "" ? 0 : 1

  billing_account_id = var.billing_account_id
  role               = "roles/billing.costsManager"
  member             = "serviceAccount:${google_service_account.terraform.email}"
}
