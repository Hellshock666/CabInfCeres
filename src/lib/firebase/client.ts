/**
 * Initialisation paresseuse du SDK Firebase côté navigateur.
 * Ce module n'est importé que dynamiquement (soumission du formulaire) ou depuis l'espace /admin,
 * afin de ne pas alourdir le chargement de la page d'accueil.
 */
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let appCheckStarted = false;
let emulatorsConnected = { auth: false, firestore: false };

export function getFirebaseApp(): FirebaseApp {
  if (typeof window === "undefined") {
    throw new Error("Le SDK Firebase client ne doit être utilisé que dans le navigateur.");
  }
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  void startAppCheck(app);
  return app;
}

export function getDb(): Firestore {
  const db = getFirestore(getFirebaseApp());
  if (useEmulators && !emulatorsConnected.firestore) {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    emulatorsConnected = { ...emulatorsConnected, firestore: true };
  }
  return db;
}

export function getAuthClient(): Auth {
  const auth = getAuth(getFirebaseApp());
  auth.languageCode = "fr";
  if (useEmulators && !emulatorsConnected.auth) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    emulatorsConnected = { ...emulatorsConnected, auth: true };
  }
  return auth;
}

/** Active Firebase App Check (anti-spam) si une clé reCAPTCHA Enterprise est configurée. */
async function startAppCheck(app: FirebaseApp): Promise<void> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_ENTERPRISE_SITE_KEY;
  if (appCheckStarted || !siteKey || useEmulators) return;
  appCheckStarted = true;
  const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import("firebase/app-check");
  initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
