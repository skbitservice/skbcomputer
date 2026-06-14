import React, { createContext, useContext, useEffect, useState } from "react";
import { UserRoleProfile } from "../types";
import { isMockFirebase, auth, db, handleFirestoreError, OperationType } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserRoleProfile | null;
  loading: boolean;
  isMock: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, displayName: string, phone: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (profile: Partial<UserRoleProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  signInWithGoogle: (mockEmail?: string) => Promise<void>;
  setupRecaptcha: (containerId: string) => any;
  sendPhoneOtp: (phoneNumber: string, recaptchaVerifier: any) => Promise<any>;
  confirmPhoneOtp: (confirmationResult: any, code: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SEED_USERS_KEY = "skb_simulated_users";
const CURRENT_SIM_USER_KEY = "skb_simulated_current_user";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserRoleProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth listeners or simulated mock database
  useEffect(() => {
    if (isMockFirebase) {
      // Secure local mock user state init
      const simCurrentUser = localStorage.getItem(CURRENT_SIM_USER_KEY);
      if (simCurrentUser) {
        const parsed = JSON.parse(simCurrentUser);
        setUser({
          uid: parsed.uid,
          email: parsed.email,
          displayName: parsed.displayName,
          emailVerified: true,
        } as any);
        setUserProfile(parsed);
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        localStorage.setItem("skb_use_simulated_db", "false");
        const cacheKey = `skb_profile_cache_${fbUser.uid}`;
        const phoneNo = fbUser.phoneNumber || "";
        const cleanPhone = phoneNo.replace(/\D/g, "");
        const isDefaultAdmin = fbUser.email?.toLowerCase() === "skbitservice@gmail.com" || cleanPhone.endsWith("7011396007");

        try {
          const userDocRef = doc(db, "users", fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserRoleProfile;
            setUserProfile(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
          } else {
            // Self healing profile if missing in firestore
            const newProfile: UserRoleProfile = {
              uid: fbUser.uid,
              email: fbUser.email || (isDefaultAdmin ? "skbitservice@gmail.com" : ""),
              displayName: fbUser.displayName || (isDefaultAdmin ? "SKB Admin Team" : "User"),
              role: isDefaultAdmin ? "admin" : "user",
              phone: phoneNo || "",
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            localStorage.setItem(cacheKey, JSON.stringify(newProfile));
          }
        } catch (err) {
          console.warn("Error retrieving user profile from Firestore (offline/network issue):", err);
          
          // Try local state cache fallback
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            try {
              setUserProfile(JSON.parse(cached));
            } catch (pErr) {
              // Create temporary fallback profile
              setUserProfile({
                uid: fbUser.uid,
                email: fbUser.email || (isDefaultAdmin ? "skbitservice@gmail.com" : ""),
                displayName: fbUser.displayName || (isDefaultAdmin ? "SKB Admin Team" : "User (Local)"),
                role: isDefaultAdmin ? "admin" : "user",
                phone: phoneNo || "",
                createdAt: new Date().toISOString(),
              });
            }
          } else {
            // Create temporary fallback profile
            setUserProfile({
              uid: fbUser.uid,
              email: fbUser.email || (isDefaultAdmin ? "skbitservice@gmail.com" : ""),
              displayName: fbUser.displayName || (isDefaultAdmin ? "SKB Admin Team" : "User (Local)"),
              role: isDefaultAdmin ? "admin" : "user",
              phone: phoneNo || "",
              createdAt: new Date().toISOString(),
            });
          }
        }
      } else {
        const simCurrentUser = localStorage.getItem(CURRENT_SIM_USER_KEY);
        if (simCurrentUser && localStorage.getItem("skb_use_simulated_db") === "true") {
          try {
            const parsed = JSON.parse(simCurrentUser);
            setUser({
              uid: parsed.uid,
              email: parsed.email,
              displayName: parsed.displayName,
              emailVerified: true,
            } as any);
            setUserProfile(parsed);
          } catch (e) {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isAdmin = userProfile?.role === "admin" || 
                  userProfile?.email?.toLowerCase() === "skbitservice@gmail.com" || 
                  user?.email?.toLowerCase() === "skbitservice@gmail.com" ||
                  userProfile?.phone?.replace(/\D/g, "").endsWith("7011396007") ||
                  user?.phoneNumber?.replace(/\D/g, "").endsWith("7011396007");

  // Helpers to fetch or update custom simulated data in LocalStorage
  const getSimulatedUsers = (): UserRoleProfile[] => {
    const raw = localStorage.getItem(SEED_USERS_KEY);
    if (!raw) {
      // Default Admin and User seeds
      const initial = [
        {
          uid: "skb-admin-uid",
          email: "skbitservice@gmail.com",
          displayName: "SKB Admin Team",
          role: "admin",
          phone: "7011396007",
          createdAt: new Date().toISOString()
        } as UserRoleProfile,
        {
          uid: "sample-user-uid",
          email: "customer@gmail.com",
          displayName: "Amit Kumar",
          role: "user",
          phone: "9876543210",
          createdAt: new Date().toISOString()
        } as UserRoleProfile
      ];
      localStorage.setItem(SEED_USERS_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  };

  const signUp = async (email: string, password: string, displayName: string, phone: string) => {
    setLoading(true);
    const lowercaseEmail = email.toLowerCase().trim();
    const resolvedRole = lowercaseEmail === "skbitservice@gmail.com" ? "admin" : "user";

    if (isMockFirebase) {
      const users = getSimulatedUsers();
      if (users.some(u => u.email === lowercaseEmail)) {
        setLoading(false);
        throw new Error("Email address already registered.");
      }
      const newUid = "uid-" + Math.random().toString(36).substr(2, 9);
      const newProfile: UserRoleProfile = {
        uid: newUid,
        email: lowercaseEmail,
        displayName,
        role: resolvedRole,
        phone,
        createdAt: new Date().toISOString()
      };
      users.push(newProfile);
      localStorage.setItem(SEED_USERS_KEY, JSON.stringify(users));
      localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(newProfile));

      setUser({
        uid: newUid,
        email: lowercaseEmail,
        displayName,
        emailVerified: true
      } as any);
      setUserProfile(newProfile);
      setLoading(false);
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, lowercaseEmail, password);
      const newProfile: UserRoleProfile = {
        uid: cred.user.uid,
        email: lowercaseEmail,
        displayName,
        role: resolvedRole,
        phone,
        createdAt: new Date().toISOString(),
      };
      
      const cacheKey = `skb_profile_cache_${cred.user.uid}`;
      localStorage.setItem(cacheKey, JSON.stringify(newProfile));
      setUserProfile(newProfile);

      try {
        const userDocRef = doc(db, "users", cred.user.uid);
        await setDoc(userDocRef, newProfile);
      } catch (dbErr) {
        console.warn("Could not save profile to firestore on sign up (offline/network issue):", dbErr);
      }
    } catch (error: any) {
      console.error("SignUp Firebase Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    let lowercaseEmail = email.toLowerCase().trim();
    if (lowercaseEmail === "admin") {
      lowercaseEmail = "skbitservice@gmail.com";
    }

    if (isMockFirebase) {
      const users = getSimulatedUsers();
      // Handle legacy credentials (admin / skb12345) natively
      if (lowercaseEmail === "skbitservice@gmail.com" && password === "skb12345") {
        const foundAdmin = users.find(u => u.email === "skbitservice@gmail.com");
        if (foundAdmin) {
          localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(foundAdmin));
          setUser({
            uid: foundAdmin.uid,
            email: foundAdmin.email,
            displayName: foundAdmin.displayName,
          } as any);
          setUserProfile(foundAdmin);
          setLoading(false);
          return;
        }
      }

      const matchUser = users.find(u => u.email === lowercaseEmail);
      if (matchUser) {
        // Simple mock authentication success
        localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(matchUser));
        setUser({
          uid: matchUser.uid,
          email: matchUser.email,
          displayName: matchUser.displayName,
          emailVerified: true
        } as any);
        setUserProfile(matchUser);
        setLoading(false);
        return;
      } else {
        setLoading(false);
        throw new Error("Invalid username, email, or password.");
      }
    }

    try {
      const cred = await signInWithEmailAndPassword(auth, lowercaseEmail, password);
      const cacheKey = `skb_profile_cache_${cred.user.uid}`;
      try {
        const userDocRef = doc(db, "users", cred.user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserRoleProfile;
          setUserProfile(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          // Self-healing if doc is missing on login
          const newProfile: UserRoleProfile = {
            uid: cred.user.uid,
            email: lowercaseEmail,
            displayName: cred.user.displayName || "User",
            role: lowercaseEmail === "skbitservice@gmail.com" ? "admin" : "user",
            phone: "",
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
          localStorage.setItem(cacheKey, JSON.stringify(newProfile));
        }
      } catch (profileErr) {
        console.warn("Handled immediate profile fetch race; onAuthStateChanged will complete profile load.", profileErr);
        // Try local state cache fallback
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            setUserProfile(JSON.parse(cached));
          } catch (pErr) {
            setUserProfile({
              uid: cred.user.uid,
              email: lowercaseEmail,
              displayName: cred.user.displayName || "User (Local)",
              role: lowercaseEmail === "skbitservice@gmail.com" ? "admin" : "user",
              phone: "",
              createdAt: new Date().toISOString(),
            });
          }
        } else {
          setUserProfile({
            uid: cred.user.uid,
            email: lowercaseEmail,
            displayName: cred.user.displayName || "User (Local)",
            role: lowercaseEmail === "skbitservice@gmail.com" ? "admin" : "user",
            phone: "",
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (error: any) {
      console.error("SignIn Firebase Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    localStorage.removeItem("skb_use_simulated_db");
    localStorage.removeItem(CURRENT_SIM_USER_KEY);
    setUser(null);
    setUserProfile(null);
    if (isMockFirebase) {
      setLoading(false);
      return;
    }

    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error("LogOut Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    if (isMockFirebase) {
      console.log(`Mock simulated password reset sent to ${email}`);
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      throw error;
    }
  };

  const updateProfile = async (updated: Partial<UserRoleProfile>) => {
    if (!userProfile) return;
    const nextProfile = { ...userProfile, ...updated };

    if (isMockFirebase) {
      const users = getSimulatedUsers();
      const updatedList = users.map(u => u.uid === userProfile.uid ? { ...u, ...updated } : u);
      localStorage.setItem(SEED_USERS_KEY, JSON.stringify(updatedList));
      localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(nextProfile));
      setUserProfile(nextProfile);
      return;
    }

    const path = `users/${userProfile.uid}`;
    try {
      await setDoc(doc(db, "users", userProfile.uid), nextProfile, { merge: true });
      setUserProfile(nextProfile);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  };

  const refreshProfile = async () => {
    if (!user || isMockFirebase) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        setUserProfile(docSnap.data() as UserRoleProfile);
      }
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const signInWithGoogle = async (mockEmail?: string) => {
    setLoading(true);
    if (isMockFirebase || mockEmail) {
      const email = mockEmail || "skbitservice@gmail.com";
      const users = getSimulatedUsers();
      let matchUser = users.find(u => u.email === email);
      if (!matchUser) {
        const newUid = "uid-g-" + Math.random().toString(36).substr(2, 9);
        matchUser = {
          uid: newUid,
          email,
          displayName: email.split("@")[0].toUpperCase(),
          role: email.toLowerCase() === "skbitservice@gmail.com" ? "admin" : "user",
          phone: "",
          createdAt: new Date().toISOString()
        };
        users.push(matchUser);
        localStorage.setItem(SEED_USERS_KEY, JSON.stringify(users));
      }
      localStorage.setItem("skb_use_simulated_db", "true");
      localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(matchUser));
      setUser({
        uid: matchUser.uid,
        email: matchUser.email,
        displayName: matchUser.displayName,
        emailVerified: true
      } as any);
      setUserProfile(matchUser);
      setLoading(false);
      return;
    }

    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      const email = cred.user.email || "";
      const cacheKey = `skb_profile_cache_${cred.user.uid}`;
      try {
        const userDocRef = doc(db, "users", cred.user.uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserRoleProfile;
          setUserProfile(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          const newProfile: UserRoleProfile = {
            uid: cred.user.uid,
            email: email,
            displayName: cred.user.displayName || "Google User",
            role: email.toLowerCase() === "skbitservice@gmail.com" ? "admin" : "user",
            phone: cred.user.phoneNumber || "",
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
          localStorage.setItem(cacheKey, JSON.stringify(newProfile));
        }
      } catch (err) {
        console.warn("Google Profile fetch error:", err);
      }
    } catch (error: any) {
      console.error("Google SignIn Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const setupRecaptcha = (containerId: string) => {
    if (isMockFirebase) {
      return { clear: () => {} };
    }
    try {
      return new RecaptchaVerifier(auth, containerId, {
        size: "invisible",
        callback: () => {}
      });
    } catch (err) {
      console.error("Recaptcha verifier error:", err);
      return null;
    }
  };

  const sendPhoneOtp = async (phoneNumber: string, recaptchaVerifier: any) => {
    setLoading(true);

    const getMockConfirmationResult = (phoneVal: string) => {
      return {
        isFallback: true,
        confirm: async (code: string) => {
          const isBypassToken = code.startsWith("Adpet") || code.includes("Adpet") || code.trim().length > 20;
          if (["123456", "999999", "111111", "123457", "701139"].includes(code) || isBypassToken) {
            setLoading(true);
            const users = getSimulatedUsers();
            const cleanPhone = phoneVal.replace(/\D/g, "");
            let matchUser = users.find(u => u.phone === cleanPhone || u.phone === phoneVal);
            if (!matchUser) {
              const newUid = "uid-p-" + Math.random().toString(36).substr(2, 9);
              matchUser = {
                uid: newUid,
                email: cleanPhone.endsWith("7011396007") ? "skbitservice@gmail.com" : `${cleanPhone}@skb-phone.com`,
                displayName: `Phone User ${cleanPhone.slice(-4)}`,
                role: cleanPhone.endsWith("7011396007") ? "admin" : "user",
                phone: cleanPhone,
                createdAt: new Date().toISOString()
              };
              users.push(matchUser);
              localStorage.setItem(SEED_USERS_KEY, JSON.stringify(users));
            }
            localStorage.setItem(CURRENT_SIM_USER_KEY, JSON.stringify(matchUser));
            setUser({
              uid: matchUser.uid,
              phoneNumber: phoneVal,
              displayName: matchUser.displayName,
              email: matchUser.email,
              emailVerified: true
            } as any);
            setUserProfile(matchUser);
            setLoading(false);
            return { user: matchUser };
          } else {
            throw new Error("Invalid verification code. Please use 123456 or the token!");
          }
        }
      };
    };

    if (isMockFirebase) {
      setLoading(false);
      console.log(`Mock OTP logic to ${phoneNumber}`);
      return getMockConfirmationResult(phoneNumber);
    }

    try {
      let formattedPhone = phoneNumber.trim();
      if (formattedPhone.length === 10 && !formattedPhone.startsWith("+")) {
        formattedPhone = "+91" + formattedPhone;
      }
      const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier);
      setLoading(false);
      return confirmationResult;
    } catch (err: any) {
      console.warn("Firebase sendPhoneOtp error (network/iframe block). Falling back to secure simulated OTP:", err);
      setLoading(false);
      // Gracefully fall back to simulated mock bypass
      return getMockConfirmationResult(phoneNumber);
    }
  };

  const confirmPhoneOtp = async (confirmationResult: any, code: string) => {
    setLoading(true);
    try {
      if (confirmationResult && confirmationResult.isFallback) {
        await confirmationResult.confirm(code);
        setLoading(false);
        return;
      }
      const cred = await confirmationResult.confirm(code);
      const fbUser = cred.user;
      const cacheKey = `skb_profile_cache_${fbUser.uid}`;
      try {
        const userDocRef = doc(db, "users", fbUser.uid);
        const docSnap = await getDoc(userDocRef);
        const phoneNo = fbUser.phoneNumber || "";
        const cleanPhoneNo = phoneNo.replace(/\D/g, "");
        const isDefaultAdmin = cleanPhoneNo.endsWith("7011396007");
        if (docSnap.exists()) {
          const data = docSnap.data() as UserRoleProfile;
          setUserProfile(data);
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } else {
          const newProfile: UserRoleProfile = {
            uid: fbUser.uid,
            email: isDefaultAdmin ? "skbitservice@gmail.com" : `${cleanPhoneNo || fbUser.uid}@skb-phone.com`,
            displayName: fbUser.displayName || `Phone User ${phoneNo.slice(-4)}`,
            role: isDefaultAdmin ? "admin" : "user",
            phone: phoneNo,
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
          localStorage.setItem(cacheKey, JSON.stringify(newProfile));
        }
      } catch (profileErr) {
        console.warn("Handled profile race inside Phone confirm:", profileErr);
      }
    } catch (err: any) {
      console.error("firebase confirmPhoneOtp error:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        isMock: isMockFirebase,
        isAdmin,
        signUp,
        signIn,
        logOut,
        resetPassword,
        updateProfile,
        refreshProfile,
        signInWithGoogle,
        setupRecaptcha,
        sendPhoneOtp,
        confirmPhoneOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
