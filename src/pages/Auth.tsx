import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, PhoneCall, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import firebaseConfig from "../firebase-applet-config.json";

interface AuthProps {
  setView: (view: string) => void;
  onSuccess: () => void;
}

export const Auth: React.FC<AuthProps> = ({ setView, onSuccess }) => {
  const { user, signIn, signUp, resetPassword } = useAuth();

  // Redirect automatically on login success
  useEffect(() => {
    if (user) {
      onSuccess();
    }
  }, [user, onSuccess]);

  // Mode state: "login" | "signup" | "forgot"
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerErrorWithShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      if (mode === "login") {
        if (!email || !password) {
          triggerErrorWithShake("Please supply both login email and password.");
          setIsSubmitting(false);
          return;
        }
        await signIn(email, password);
        onSuccess();
      } else if (mode === "signup") {
        if (!email || !password || !displayName || !phone) {
          triggerErrorWithShake("All registry fields are mandatory.");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          triggerErrorWithShake("Password must contains at least 6 characters.");
          setIsSubmitting(false);
          return;
        }
        if (!/^\d{10}$/.test(phone)) {
          triggerErrorWithShake("Please supply a valid 10-digit mobile number.");
          setIsSubmitting(false);
          return;
        }
        await signUp(email, password, displayName, phone);
        onSuccess();
      } else {
        // Forgot password
        if (!email) {
          triggerErrorWithShake("Please enter your account email to trigger resets.");
          setIsSubmitting(false);
          return;
        }
        await resetPassword(email);
        setSuccessMsg("A secure password recovery link was dispatched to your email address.");
      }
    } catch (err: any) {
      let friendlyError = err.message || "An authentication exception occurred.";
      const errMsgStr = String(err.message || err.code || "");
      if (errMsgStr.includes("auth/operation-not-allowed")) {
        friendlyError = `Firebase Provider Error: 'Email/Password' sign-in is currently disabled in your Firebase console.

Step-by-step instructions to enable:
1. Go to the Firebase Console: https://console.firebase.google.com/
2. Open your project ("${firebaseConfig.projectId || "yugsharma"}").
3. Click "Authentication" on the left sidebar.
4. Select the "Sign-in method" tab.
5. Click "Add new provider", choose "Email/Password", toggle it to "Enabled" and click "Save".
6. Refresh this web applet and try again!`;
      } else if (errMsgStr.includes("auth/email-already-in-use")) {
        friendlyError = "An account with this email already exists. Please sign in or use another email.";
      } else if (errMsgStr.includes("auth/invalid-email")) {
        friendlyError = "Please enter a valid email address (e.g. customer@gmail.com).";
      } else if (errMsgStr.includes("auth/weak-password")) {
        friendlyError = "Weak password. Password should be at least 6 characters.";
      } else if (errMsgStr.includes("auth/user-not-found") || errMsgStr.includes("auth/wrong-password") || errMsgStr.includes("auth/invalid-credential")) {
        const trimmedEmail = email.toLowerCase().trim();
        if (trimmedEmail === "skbitservice@gmail.com") {
          friendlyError = "Unable to sign in as Admin. If you haven't created your password for 'skbitservice@gmail.com' on this live Firebase database yet, please click 'Create Account' below to sign up with this email first. It will automatically gain full Admin rights.";
        } else {
          friendlyError = "Invalid email or password. Please check your credentials and try again. Brand new? Click 'Create Account' below to sign up!";
        }
      }
      triggerErrorWithShake(friendlyError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-body min-h-[90vh] flex items-center justify-center py-12 px-6 relative z-10 text-[#0d530e]">
      
      {/* Background traces */}
      <div className="auth-wrap w-full max-w-sm">
        <div className={`auth-card bg-[#FBF5DD] border border-[#0d530e]/12 p-8 sm:p-10 rounded-2xl shadow-2xl relative select-none ${
          shake ? "animate-shake" : ""
        }`}>
          
          {/* Brand header snippet */}
          <button 
            type="button"
            onClick={() => setView("home")} 
            className="flex items-center gap-2 justify-center mx-auto mb-6 text-left"
          >
            <span className="font-mono text-center font-bold text-xs bg-[#306D29] text-[#FBF5DD] px-2 py-1 select-none">
              SKB
            </span>
            <span className="font-sans font-bold text-gray-900 text-sm tracking-wide block uppercase">
              SKB COMPUTER
            </span>
          </button>

          <h1 className="text-xl font-bold font-sans text-gray-900 text-center select-none uppercase tracking-wide">
            {mode === "login" ? "Admin & User Login" : mode === "signup" ? "Create Account" : "Recover Password"}
          </h1>
          <p className="text-xs text-[#4A6B43] text-center mt-1.5 mb-6 leading-relaxed select-none">
            {mode === "login" 
              ? "Access user orders or check admin diagnostics." 
              : mode === "signup" 
                ? "Register a service account to track orders and support tickets." 
                : "Submit your account email below to recover pass properties."}
          </p>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            
            {/* Display name (only signup) */}
            {mode === "signup" && (
              <div>
                <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Full name</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold"
                  />
                  <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                    <User size={14} />
                  </span>
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Account Email or Username</label>
              <div className="relative">
                <input
                  required
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g.customer@gmail.com"
                  className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold"
                />
                <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                  <Mail size={14} />
                </span>
              </div>
            </div>

            {/* Phone (only signup) */}
            {mode === "signup" && (
              <div>
                <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Phone Call Contact</label>
                <div className="relative">
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 7011396007"
                    className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold"
                  />
                  <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                    <PhoneCall size={14} />
                  </span>
                </div>
              </div>
            )}

            {/* Password (only login / signup) */}
            {mode !== "forgot" && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider">Secure Password</label>
                  {mode === "login" && (
                    <button
                      type="button"
                      onClick={() => setMode("forgot")}
                      className="text-[10px] text-[#306D29] font-bold hover:underline"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    required
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold"
                  />
                  <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                    <Lock size={14} />
                  </span>
                </div>
              </div>
            )}

            {/* Error notifications */}
            {errorMsg && (
              <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-300/35 p-3 rounded-md text-center leading-relaxed">
                {errorMsg}
              </p>
            )}

            {/* Success notifications */}
            {successMsg && (
              <p className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-300/35 p-3 rounded-md text-center leading-relaxed animate-pulse">
                {successMsg}
              </p>
            )}

            {/* Main triggers */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl font-bold font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {mode === "login" ? "Complete Log In" : mode === "signup" ? "Agree &amp; Sign Up" : "Send Password Resets"}
                </span>
              )}
            </button>
          </form>

          {/* Auxiliary account toggles */}
          <div className="mt-6 flex flex-col gap-3 font-semibold text-center text-xs">
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("signup")} className="text-[#306D29] hover:underline">
                  Don't have a secure account? Create one &rarr;
                </button>
              </>
            ) : mode === "signup" ? (
              <button onClick={() => setMode("login")} className="text-[#306D29] hover:underline">
                Have a registered account? Sign In &rarr;
              </button>
            ) : (
              <button onClick={() => setMode("login")} className="text-gray-500 hover:text-[#0D530E] flex items-center gap-1.5 justify-center">
                <ArrowLeft size={12} />
                <span>Return to Sign In</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
