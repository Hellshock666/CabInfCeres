# Cabinet Infirmier Cérès – Reims Centre Cathédrale

Site vitrine mobile-first (PWA) + espace infirmiers sécurisé.
**Stack :** Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · Firebase (App Hosting, Firestore, Auth, Cloud Functions).

## Arborescence

```
├── .github/workflows/           # ci.yml · deploy.yml (Firebase) · infra.yml (Terraform)
├── apphosting.yaml              # Firebase App Hosting (runtime + variables d'env.)
├── firebase.json · .firebaserc  # Firestore, Functions, App Hosting, émulateurs
├── infra/terraform/             # IaC : APIs, Firestore, Auth, App Hosting, IAM, fédération GitHub, budget
├── scripts/bootstrap.ps1        # Mise en place initiale (une fois)
├── docs/DEPLOIEMENT.md          # Guide de déploiement
├── firestore.rules              # Sécurité : création publique stricte, lecture réservée aux infirmiers
├── functions/
│   ├── src/index.ts             # Purge RGPD planifiée (toutes les heures, > 14 jours)
│   └── scripts/set-nurse-claim.mjs  # Création des comptes infirmiers (rôle nurse)
├── public/
│   ├── manifest.json · sw.js · offline.html   # PWA
│   └── icons/                   # 192/512 (any + maskable), apple-touch-icon
└── src/
    ├── app/
    │   ├── layout.tsx · page.tsx · globals.css
    │   ├── admin/               # /admin – tableau de bord (Firebase Auth)
    │   ├── confidentialite/     # Politique de confidentialité & mentions légales
    │   └── robots.ts · sitemap.ts
    ├── assets/hero-cathedrale.webp  # ⚠️ visuel PROVISOIRE (extrait du mockup) – à remplacer
    ├── components/
    │   ├── landing/             # Header + menu mobile, Hero, Services, LocalSection (domicile + plan + cabinet),
    │   │                        # ExpertiseBand (équipe), Contact + formulaire, Footer, barre d'appel mobile
    │   ├── admin/               # AdminApp, LoginForm, Dashboard, RequestCard, useNurseAuth
    │   └── ui/                  # Icon, PhoneLink (tel:), ScrollToContactLink (smooth scroll), LogoMark
    ├── config/
    │   ├── site.ts              # ⚠️ Source unique : équipe, téléphone, adresse, horaires, quartiers, accroches
    │   ├── services.ts          # Catalogue des soins
    │   └── navigation.ts        # Menu principal / pied de page
    └── lib/
        ├── callback-requests.ts # Modèle de données, listes déroulantes, validation
        └── firebase/            # Client SDK (chargé à la demande) + accès Firestore
```

## Démarrage local

```bash
npm install
cp .env.example .env.local      # renseigner la config web Firebase
npm run dev                     # http://localhost:3000
```

Avec les émulateurs Firebase (aucune donnée réelle) : `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true` dans `.env.local`, puis `npm run emulators` dans un second terminal.

## Mise en production et infrastructure

Tout est dans le dépôt (Terraform + GitHub Actions, sans clé grâce à Workload Identity Federation).
Guide complet : **[docs/DEPLOIEMENT.md](docs/DEPLOIEMENT.md)**. En résumé :

1. Passer le projet Firebase `cabinet-ceres` en forfait **Blaze**.
2. `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap.ps1` (une seule fois).
3. Ensuite, chaque fusion dans `main` déploie automatiquement (`deploy.yml`, `infra.yml`).

## Conformité RGPD / CNIL – choix de conception

- **Minimisation** : 4 champs seulement (nom, téléphone, type de prise en charge, créneau). Aucune zone de texte libre, aucune donnée de santé ; les valeurs des listes sont purement logistiques.
- **Double validation** : côté client (`validateCallbackInput`) **et** côté serveur (`firestore.rules` : clés exactes, énumérations, format du téléphone, horodatage serveur, statut imposé).
- **Accès** : lecture / traitement / suppression uniquement avec le custom claim `nurse` (vérifié par les règles, pas seulement par l'interface).
- **Conservation** : purge automatique horaire de *toutes* les demandes de plus de 14 jours (traitées ou non) ; suppression manuelle possible dès le traitement.
- **Information** : mention sous le formulaire + page `/confidentialite` (les champs `[À COMPLÉTER]` doivent être renseignés).
- **Anti-spam** : pot de miel + délai minimal de saisie ; App Check recommandé.
- Pas de cookie de mesure d'audience ; les logs de la fonction ne contiennent aucune donnée personnelle.

## Performance

- Page d'accueil rendue statiquement, sans JavaScript lourd : le SDK Firebase n'est chargé **qu'à l'envoi du formulaire** (import dynamique) ou dans `/admin`.
- Icônes SVG inline, police Inter auto-hébergée par `next/font`, aucune image lourde.
- Service worker : cache-first pour les assets versionnés, network-first pour les pages, page hors ligne avec bouton d'appel.

## Design

Rendu calqué sur le mockup de référence : palette bleu marine (`--color-brand-*` dans `globals.css`), serif **Cormorant Garamond** (marque, citations), manuscrite **Caveat** (accroches), **Inter** (texte) – toutes auto-hébergées via `next/font`. Le logo (pousse à trois feuilles) est un SVG inline (`LogoMark.tsx`), décliné en icônes PWA.

**Photo du hero** : `src/assets/hero-cathedrale.webp` est un extrait basse définition du mockup, à remplacer par une photo libre de droits (ou personnelle) d'au moins 1600 px de large, sous le même nom de fichier.

## À valider avant mise en ligne

Les informations du cabinet (équipe, adresse, soins, quartiers) sont reprises du mockup – à relire. Restent à compléter dans `/confidentialite` : n° RPPS / SIRET, région d'hébergement, e-mail de contact RGPD. Remplacer la photo du hero. Supprimer le fichier obsolète `src/components/landing/ServiceZone.tsx` s'il est encore présent dans votre dossier.
