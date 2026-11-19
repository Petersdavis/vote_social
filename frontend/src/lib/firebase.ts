import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import type { Functions } from "firebase/functions";

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
let functionsPromise:
  | Promise<{
      functions: Functions;
      functionsModule: typeof import("firebase/functions");
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
        // Use `initializeAuth` with `prodErrorMap` and without `popupRedirectResolver`
        // so Firebase does NOT inject the hidden `__/auth/iframe` (93 KiB `iframe.js`)
        // on initial page load or bundle verbose debug error strings.
        const auth = authModule.initializeAuth(app, {
          persistence: [
            authModule.indexedDBLocalPersistence,
            authModule.browserLocalPersistence,
          ],
          errorMap: authModule.prodErrorMap,
        });
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

export function loadFirebaseFunctions(): Promise<{
  functions: Functions;
  functionsModule: typeof import("firebase/functions");
}> {
  if (!functionsPromise) {
    functionsPromise = Promise.all([
      loadFirebaseApp(),
      import("firebase/functions"),
    ]).then(([app, functionsModule]) => {
      const functions = functionsModule.getFunctions(
        app,
        "northamerica-northeast1",
      );
      if (useFirebaseEmulators) {
        functionsModule.connectFunctionsEmulator(functions, "127.0.0.1", 5001);
      }
      return { functions, functionsModule };
    });
  }
  return functionsPromise;
}
