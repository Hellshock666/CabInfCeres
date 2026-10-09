"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "forbidden"; user: User }
  | { status: "nurse"; user: User };

/**
 * Suit l'état d'authentification et vérifie le custom claim `nurse`.
 * Le claim est attribué par un administrateur via functions/scripts/set-nurse-claim.mjs.
 */
export function useNurseAuth(): AuthState {
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
          const token = await getIdTokenResult(user, true);
          setState(token.claims.nurse === true ? { status: "nurse", user } : { status: "forbidden", user });
        } catch {
          setState({ status: "forbidden", user });
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
