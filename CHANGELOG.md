# Journal des versions

Format inspiré de [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), versions [SemVer](https://semver.org/lang/fr/).

## [1.0.0] – 2026-10-10

Première version en production : https://web--cabinet-ceres.europe-west4.hosted.app

### Site public
- Page d'accueil mobile-first : en-tête avec appel direct, hero « Reims Centre – Cathédrale », soins proposés, zone d'intervention (quartiers de Reims), équipe, infos pratiques, pied de page.
- Formulaire de demande de rappel minimal (nom, téléphone, type de prise en charge, créneau) : aucun champ libre, aucune donnée de santé.
- Accès direct au formulaire sur mobile : bouton dans l'en-tête et barre d'actions fixe (Appeler / Être rappelé), défilement fluide.
- Page `/confidentialite`, données structurées `MedicalBusiness`, `robots.txt`, `sitemap.xml`.
- PWA : manifeste, icônes 192/512 (dont maskable), service worker avec page hors ligne.

### Espace privé
- `/admin` (rôle `nurse`) : demandes de rappel en temps réel, marquer comme traitée / remettre à rappeler, supprimer.
- `/admin/stats` (rôle `owner`) : demandes reçues, taux et délai de traitement, demandes en attente, disponibilité et temps de réponse du site, répartitions (type, créneau, heure, jour), purges RGPD ; périodes 7/30/90 jours.
- Comptes gérés par script (`npm run set-nurse -- <email> [--owner] [--create | --revoke]`), inscription publique désactivée.

### Sécurité et RGPD
- Règles Firestore strictes : création publique au format exact, lecture/traitement réservés aux rôles, statistiques en lecture seule pour le propriétaire.
- Fonction planifiée (toutes les 15 min) : statistiques anonymes, lecture de la disponibilité, purge de toutes les demandes de plus de 14 jours.

### Infrastructure
- Terraform (état GCS) : APIs, Firebase, Firestore, Auth, App Hosting, comptes de service, fédération d'identité GitHub (sans clé), test de disponibilité, nettoyage Artifact Registry, alerte budget.
- GitHub Actions : CI (lint, types, build, Terraform), déploiement automatique sur `main`, application Terraform, Dependabot.

[1.0.0]: https://github.com/Hellshock666/CabInfCeres/releases/tag/v1.0.0
