import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

import { firebaseConfig, useFirebaseEmulators } from "./env";

/**
 * Lazy-loaded Firebase client SDK singletons.
 *
 * Uses dynamic `import()` so `firebase/app`, `firebase/auth`, and
 * `firebase/firestore` are code-split out of the initial page bundle and
 * fetched asynchronously after first paint.
 */

let appPromise: Promise<FirebaseApp> | undefined;
let authPromise:
  | Promise<{ auth: Auth; authModule: typeof import("firebase/auth") }>
  | undefined;
let firestorePromise:
  | Promise<{
      db: Firestore;
      firestoreModule: typeof import("firebase/firestore");
    }>
  | undefined;

export function loadFirebaseApp(): Promise<FirebaseApp> {
  if (!appPromise) {
    appPromise = import("firebase/app").then(
      ({ initializeApp, getApps, getApp }) =>
        getApps().length > 0 ? getApp() : initializeApp(firebaseConfig),
    );
  }
  return appPromise;
}

export function loadFirebaseAuth(): Promise<{
  auth: Auth;
  authModule: typeof import("firebase/auth");
}> {
  if (!authPromise) {
    authPromise = Promise.all([loadFirebaseApp(), import("firebase/auth")]).then(
      ([app, authModule]) => {
        const auth = authModule.getAuth(app);
        if (useFirebaseEmulators) {
          authModule.connectAuthEmulator(auth, "http://127.0.0.1:9099", {
            disableWarnings: true,
          });
        }
        return { auth, authModule };
      },
    );
  }
  return authPromise;
}

export function loadFirebaseFirestore(): Promise<{
  db: Firestore;
  firestoreModule: typeof import("firebase/firestore");
}> {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      loadFirebaseApp(),
      import("firebase/firestore"),
    ]).then(([app, firestoreModule]) => {
      const db = firestoreModule.getFirestore(app);
      if (useFirebaseEmulators) {
        firestoreModule.connectFirestoreEmulator(db, "127.0.0.1", 8080);
      }
      return { db, firestoreModule };
    });
  }
  return firestorePromise;
}
