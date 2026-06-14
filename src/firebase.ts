import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import firebaseConfig from "./firebase-applet-config.json";

// Check if we are running in mock preview mode
export const isMockFirebase = firebaseConfig.apiKey === "mock-api-key" || !firebaseConfig.apiKey;

let appInstance;
let authInstance: any;
let dbInstance: any;
let rtdbInstance: any;

try {
  if (!isMockFirebase) {
    appInstance = initializeApp(firebaseConfig);
    const dbId = (firebaseConfig as any).firestoreDatabaseId;
    if (dbId && dbId !== "(default)") {
      dbInstance = getFirestore(appInstance, dbId);
    } else {
      dbInstance = getFirestore(appInstance);
    }
    
    if (firebaseConfig.databaseURL) {
      rtdbInstance = getDatabase(appInstance, firebaseConfig.databaseURL);
    } else {
      rtdbInstance = getDatabase(appInstance);
    }
    
    authInstance = getAuth(appInstance);
  }
} catch (error) {
  console.warn("Firebase initialization failed, falling back to secure simulated local storage mode.", error);
}

export const db = dbInstance;
export const rtdb = rtdbInstance;
export const auth = authInstance;

async function testConnection() {
  if (isMockFirebase || !db) return;
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("Firebase Firestore connected successfully.");
    sessionStorage.removeItem("firestore_connection_error");
  } catch (error) {
    const errorStr = error instanceof Error ? error.message : String(error);
    if (errorStr.includes("the client is offline")) {
      console.warn("Please check your Firebase configuration.");
    } else {
      console.warn("Firestore connection check resolved:", error);
      if (errorStr.includes("Database") && (errorStr.includes("not found") || errorStr.includes("(default)"))) {
        sessionStorage.setItem("firestore_connection_error", "database_not_found");
      } else {
        sessionStorage.setItem("firestore_connection_error", errorStr);
      }
    }
  }
}
testConnection();

export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentAuth = authInstance;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
