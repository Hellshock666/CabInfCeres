#!/usr/bin/env node
/**
 * Gestion des comptes de l'espace infirmiers (rôle `nurse`) et du propriétaire (rôle `owner`,
 * accès à la page /admin/stats).
 *
 * Prérequis (une fois) :
 *   gcloud auth application-default login
 *
 * Utilisation (depuis le dossier functions, après `npm install`) :
 *   npm run set-nurse -- infirmier@exemple.fr --create   → crée le compte s'il n'existe pas, accorde l'accès
 *                                                          et affiche un lien pour choisir le mot de passe
 *   npm run set-nurse -- infirmier@exemple.fr            → accorde l'accès à un compte existant
 *   npm run set-nurse -- infirmier@exemple.fr --revoke   → retire l'accès et déconnecte le compte
 *
 *   Ajouter --owner pour gérer le rôle propriétaire (statistiques) au lieu du rôle infirmier :
 *   npm run set-nurse -- moi@exemple.fr --owner --create → crée le compte et accorde l'accès aux statistiques
 *   npm run set-nurse -- moi@exemple.fr --owner --revoke → retire l'accès aux statistiques
 *
 * Projet : variable GOOGLE_CLOUD_PROJECT, sinon « cabinet-ceres ».
 */
import { randomBytes } from "node:crypto";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, ...flags] = process.argv.slice(2);
if (!email || !email.includes("@")) {
  console.error("Usage : npm run set-nurse -- <email> [--owner] [--create | --revoke]");
  process.exit(1);
}
const create = flags.includes("--create");
const revoke = flags.includes("--revoke");
const role = flags.includes("--owner") ? "owner" : "nurse";
const roleLabel = role === "owner" ? "statistiques (propriétaire)" : "espace infirmiers";
const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? "cabinet-ceres";

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();

async function findOrCreateUser() {
  try {
    return { user: await auth.getUserByEmail(email), created: false };
  } catch (error) {
    if (error?.code !== "auth/user-not-found" || !create) throw error;
    // Mot de passe aléatoire jamais communiqué : l'infirmier choisit le sien via le lien de réinitialisation.
    const user = await auth.createUser({ email, password: randomBytes(24).toString("base64url"), emailVerified: false });
    return { user, created: true };
  }
}

const { user, created } = await findOrCreateUser();
const claims = { ...(user.customClaims ?? {}) };

if (revoke) delete claims[role];
else claims[role] = true;

await auth.setCustomUserClaims(user.uid, claims);
if (revoke) await auth.revokeRefreshTokens(user.uid);

console.log(`${created ? "Compte créé. " : ""}${revoke ? "Accès retiré" : "Accès accordé"} (${roleLabel}) pour ${email}.`);

if (created) {
  const link = await auth.generatePasswordResetLink(email);
  console.log("\nLien pour définir le mot de passe du compte (valable 1 h) :\n" + link);
}
