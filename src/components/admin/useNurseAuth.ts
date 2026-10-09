"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

/** Rôles portés par les custom claims (attribués via functions/scripts/set-nurse-claim.mjs). */
export interface StaffRoles {
  /** Espace infirmiers : demandes de rappel. */
  nurse: boolean;
  /** Propriétaire du site : statistiques (/admin/stats). */
  owner: boolean;
}

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: User; roles: StaffRoles };

const NO_ROLES: StaffRoles = { nurse: false, owner: false };

/**
 * Suit l'état d'authentification et lit les custom claims `nurse` / `owner`.
 * Garde d'affichage uniquement : l'accès aux données est imposé par firestore.rules.
 */
export function useStaffAuth(): AuthState {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      const [{ onAuthStateChanged, getIdTokenResult }, { getAuthClient }] = await Promise.all([
        import("firebase/auth"),
        import("@/lib/firebase/client"),
      ]);
      if (cancelled) return;

      unsubscribe = onAuthStateChanged(getAuthClient(), async (user) => {
        if (!user) {
          setState({ status: "signedOut" });
          return;
        }
        try {
          // Rafraîchissement forcé : prend en compte un claim attribué récemment.
          const { claims } = await getIdTokenResult(user, true);
          setState({
            status: "signedIn",
            user,
            roles: { nurse: claims.nurse === true, owner: claims.owner === true },
          });
        } catch {
          setState({ status: "signedIn", user, roles: NO_ROLES });
        }
      });
    })();

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  return state;
}

export async function signOutNurse(): Promise<void> {
  const [{ signOut }, { getAuthClient }] = await Promise.all([
    import("firebase/auth"),
    import("@/lib/firebase/client"),
  ]);
  await signOut(getAuthClient());
}
