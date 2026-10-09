/**
 * Accès Firestore aux demandes de rappel (création publique + gestion par les infirmiers).
 */
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from "firebase/firestore";
import {
  CALLBACK_COLLECTION,
  type CallbackRequest,
  type CallbackRequestInput,
} from "@/lib/callback-requests";
import { getDb } from "./client";

/** Création publique : le format exact est vérifié une seconde fois par firestore.rules. */
export async function submitCallbackRequest(input: CallbackRequestInput): Promise<void> {
  await addDoc(collection(getDb(), CALLBACK_COLLECTION), {
    fullName: input.fullName,
    phone: input.phone,
    careType: input.careType,
    timeSlot: input.timeSlot,
    status: "pending",
    createdAt: serverTimestamp(),
  });
}

/** Abonnement temps réel (réservé aux infirmiers). Retourne la fonction de désabonnement. */
export function subscribeToCallbackRequests(
  onData: (requests: CallbackRequest[]) => void,
  onError: (error: Error) => void,
): () => void {
  const q = query(collection(getDb(), CALLBACK_COLLECTION), orderBy("createdAt", "desc"), limit(300));
  return onSnapshot(
    q,
    (snapshot) => {
      onData(
        snapshot.docs.map((d) => {
          const data = d.data({ serverTimestamps: "estimate" });
          return {
            id: d.id,
            fullName: data.fullName,
            phone: data.phone,
            careType: data.careType,
            timeSlot: data.timeSlot,
            status: data.status,
            createdAt: (data.createdAt as Timestamp | null)?.toDate() ?? null,
            processedAt: (data.processedAt as Timestamp | null | undefined)?.toDate() ?? null,
          } satisfies CallbackRequest;
        }),
      );
    },
    onError,
  );
}

export async function markAsProcessed(id: string): Promise<void> {
  await updateDoc(doc(getDb(), CALLBACK_COLLECTION, id), {
    status: "processed",
    processedAt: serverTimestamp(),
  });
}

export async function markAsPending(id: string): Promise<void> {
  await updateDoc(doc(getDb(), CALLBACK_COLLECTION, id), {
    status: "pending",
    processedAt: null,
  });
}

export async function deleteCallbackRequest(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), CALLBACK_COLLECTION, id));
}
