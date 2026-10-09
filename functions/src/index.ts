/**
 * Purge RGPD automatique des demandes de rappel.
 *
 * Toutes les heures, supprime les demandes créées il y a plus de 14 jours (en attente OU traitées),
 * ce qui garantit une durée de conservation maximale de 14 jours (+ 1 h au pire).
 * Les constantes doivent rester alignées avec src/lib/callback-requests.ts.
 */
import { setGlobalOptions } from "firebase-functions/v2";
import * as logger from "firebase-functions/logger";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();

setGlobalOptions({
  region: "europe-west1",
  maxInstances: 1,
});

const CALLBACK_COLLECTION = "callbackRequests";
const RETENTION_DAYS = 14;
const BATCH_SIZE = 400;

export const purgeExpiredCallbackRequests = onSchedule(
  {
    schedule: "every 1 hours",
    timeZone: "Europe/Paris",
    retryCount: 3,
    timeoutSeconds: 120,
    memory: "256MiB",
    // Compte de service dédié créé par Terraform (infra/terraform/functions.tf) : accès Firestore uniquement.
    serviceAccount: "purge-function@",
  },
  async () => {
    const db = getFirestore();
    const cutoff = Timestamp.fromMillis(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    let deleted = 0;

    // Suppression par lots (limite de 500 opérations par batch Firestore).
    for (;;) {
      const snapshot = await db
        .collection(CALLBACK_COLLECTION)
        .where("createdAt", "<", cutoff)
        .limit(BATCH_SIZE)
        .get();

      if (snapshot.empty) break;

      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
      deleted += snapshot.size;

      if (snapshot.size < BATCH_SIZE) break;
    }

    // Journalise uniquement le volume : aucune donnée personnelle dans les logs.
    logger.info("Purge RGPD terminée", { deleted, cutoff: cutoff.toDate().toISOString() });
  },
);
