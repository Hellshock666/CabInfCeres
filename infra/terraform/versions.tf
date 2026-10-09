terraform {
  required_version = ">= 1.6.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 6.20, < 8.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 6.20, < 8.7"
    }
  }

  # Bucket fourni à l'init : `terraform init -backend-config="bucket=<projet>-tfstate"`
  # (créé par scripts/bootstrap.ps1, réutilisé par la CI).
  backend "gcs" {
    prefix = "terraform/state"
  }
}

provider "google" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

provider "google-beta" {
  project               = var.project_id
  region                = var.region
  user_project_override = true
  billing_project       = var.project_id
}

data "google_project" "this" {
  project_id = var.project_id
}
