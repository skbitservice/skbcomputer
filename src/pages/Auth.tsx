import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { User, Mail, Lock, PhoneCall, ArrowLeft, RefreshCw, KeyRound } from "lucide-react";
import firebaseConfig from "../firebase-applet-config.json";

interface AuthProps {
  setView: (view: string) => void;
  onSuccess: (isAdminUser: boolean) => void;
}

export const Auth: React.FC<AuthProps> = ({ setView, onSuccess }) => {
  const { 
    user, 
    signIn, 
    signUp, 
    resetPassword,
    signInWithGoogle,
    setupRecaptcha,
    sendPhoneOtp,
    confirmPhoneOtp,
    isMock,
    isAdmin
  } = useAuth();

  // Redirect automatically on login success
  useEffect(() => {
    if (user) {
      onSuccess(isAdmin);
    }
  }, [user, isAdmin, onSuccess]);

  // Mode state: "login" | "signup" | "forgot" | "phone-login"
  const [mode, setMode] = useState<"login" | "signup" | "forgot" | "phone-login">("login");

  // Inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");

  // Phone Login specific states
  const [phoneInput, setPhoneInput] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<any>(null);

  // States
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  // Instantiate Recaptcha
  useEffect(() => {
    if (mode === "phone-login" && !recaptchaVerifier) {
      const verifier = setupRecaptcha("recaptcha-container");
      setRecaptchaVerifier(verifier);
    }
  }, [mode, recaptchaVerifier, setupRecaptcha]);

  // Cleanup Recaptcha
  useEffect(() => {
    return () => {
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (e) {}
      }
    };
  }, [recaptchaVerifier]);

  const triggerErrorWithShake = (msg: string) => {
    setErrorMsg(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    if (!phoneInput || phoneInput.trim().length < 10) {
      triggerErrorWithShake("Please supply a valid 10-digit mobile number.");
      setIsSubmitting(false);
      return;
    }

    try {
      const cleanPhone = phoneInput.replace(/\D/g, "");
      let toSend = cleanPhone;
      if (toSend.length === 10) {
        toSend = "+91" + toSend;
      } else if (!toSend.startsWith("+")) {
        toSend = "+" + toSend;
      }

      const result = await sendPhoneOtp(toSend, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setSuccessMsg("SMS verification OTP block sent! Please complete with verification code below.");
    } catch (err: any) {
      console.error(err);
      triggerErrorWithShake(err.message || "Failed to dispatch mobile verification OTP. Please verify number & try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    if (!otpCode || otpCode.trim().length < 4) {
      triggerErrorWithShake("Please enter the verification code received on your phone.");
      setIsSubmitting(false);
      return;
    }

    try {
      await confirmPhoneOtp(confirmationResult, otpCode.trim());
      setSuccessMsg("Mobile verification completed! Logged in successfully.");
      onSuccess(isAdmin);
    } catch (err: any) {
      console.error(err);
      triggerErrorWithShake(err.message || "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (presetEmail?: string) => {
    if (isSubmitting) return;
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);
    try {
      await signInWithGoogle(presetEmail);
      setSuccessMsg("Google Authentication completed successfully!");
      onSuccess(isAdmin);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || "Google Authentication failed.";
      if (msg.includes("auth/operation-not-allowed") || msg.includes("configuration") || msg.includes("developer")) {
        msg = `Google Provider Error: Google authentication is not enabled.
        
To enable:
1. Open your Firebase Project Console: https://console.firebase.google.com/
2. Click "Authentication" -> "Sign-in method" tab.
3. Add "Google" provider, key in details & click save.`;
      }
      triggerErrorWithShake(msg);
    } finally {
      setIsSubmitting(false);
    }
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
        onSuccess(isAdmin);
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
        onSuccess(isAdmin);
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
            {mode === "login" 
              ? "Admin & User Login" 
              : mode === "signup" 
                ? "Create Account" 
                : mode === "phone-login" 
                  ? "Mobile OTP Log In" 
                  : "Recover Password"}
          </h1>
          <p className="text-xs text-[#4A6B43] text-center mt-1.5 mb-6 leading-relaxed select-none">
            {mode === "login" 
              ? "Access user orders or check admin diagnostics." 
              : mode === "signup" 
                ? "Register a service account to track orders and support tickets." 
                : mode === "phone-login"
                  ? "Access your dashboard via secure one-time-password (OTP)."
                  : "Submit your account email below to recover pass properties."}
          </p>

          {mode === "phone-login" ? (
            <div className="space-y-4">
              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">Mobile Number (with Country Code)</label>
                    <div className="relative">
                      <input
                        required
                        type="tel"
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value)}
                        placeholder="e.g. 7011396007"
                        className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold"
                      />
                      <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                        <PhoneCall size={14} />
                      </span>
                    </div>
                  </div>

                  {isMock && (
                    <div className="bg-[#4a6b43]/10 border border-[#4a6b43]/20 p-3 rounded-lg text-[10px] text-[#2c4b26] leading-relaxed select-none">
                      <span className="font-bold block uppercase mb-0.5">💡 Simulated Sandbox:</span>
                      To log in with full Admin rights, enter phone number <strong className="underline">7011396007</strong>
                    </div>
                  )}

                  {/* Invisible Recaptcha container */}
                  <div id="recaptcha-container" className="my-1"></div>

                  {errorMsg && (
                    <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-300/35 p-3 rounded-md text-center leading-relaxed">
                      {errorMsg}
                    </p>
                  )}

                  {successMsg && (
                    <p className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-300/35 p-3 rounded-md text-center leading-relaxed animate-pulse">
                      {successMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl font-bold font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Sending OTP SMS...</span>
                      </>
                    ) : (
                      <span>Request Security OTP</span>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#4A6B43] uppercase tracking-wider mb-1.5">EnterSMS Security Verification OTP</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="e.g. 123456"
                        className="w-full bg-white border border-[#0d530e]/12 p-3 pl-10 rounded-lg text-xs focus:outline-none focus:border-[#306D29] font-semibold text-center tracking-widest text-[13px]"
                      />
                      <span className="absolute left-3.5 top-3.5 text-[#4A6B43]">
                        <KeyRound size={14} />
                      </span>
                    </div>
                  </div>

                  {isMock && (
                    <div className="bg-[#4a6b43]/10 border border-[#4a6b43]/20 p-3 rounded-lg text-[10px] text-[#2c4b26] leading-relaxed select-none">
                      <span className="font-bold block uppercase mb-0.5">💡 Simulated Code:</span>
                      Type in simulated security code <strong className="underline">123456</strong> to proceed!
                    </div>
                  )}

                  {errorMsg && (
                    <p className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-300/35 p-3 rounded-md text-center leading-relaxed">
                      {errorMsg}
                    </p>
                  )}

                  {successMsg && (
                    <p className="text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-300/35 p-3 rounded-md text-center leading-relaxed animate-pulse">
                      {successMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-[#306D29] hover:bg-[#0D530E] text-[#FBF5DD] rounded-xl font-bold font-sans text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Verifying OTP Code...</span>
                      </>
                    ) : (
                      <span>Complete Mobile Log In</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setErrorMsg(""); }}
                    className="w-full text-center text-[10px] text-[#306D29] font-bold hover:underline block mt-1"
                  >
                    Use different mobile number
                  </button>
                </form>
              )}
            </div>
          ) : (
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
          )}

          {/* Social Sign In section */}
          <div className="space-y-3.5 pt-2 select-none">
            <div className="relative my-5 flex items-center justify-center select-none font-sans font-bold text-[10px] text-gray-400 uppercase tracking-wider">
              <span className="absolute w-full h-[1px] bg-[#0d530e]/10" />
              <span className="relative bg-[#FBF5DD] px-3.5 z-10 text-[9px]">Additional login methods</span>
            </div>

            {/* Google authenticate block */}
            <button
              type="button"
              onClick={() => handleGoogleLogin()}
              disabled={isSubmitting}
              className="w-full py-3 bg-white hover:bg-gray-50 border border-[#0d530e]/12 text-gray-800 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2.5 transition shadow-sm hover:shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Quick Sandbox Login Actions for Review ease */}
            {isMock && (
              <div className="flex gap-1.5 justify-center mt-1">
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("skbitservice@gmail.com")}
                  className="px-2 py-1 bg-[#306D29]/10 hover:bg-[#306D29]/20 text-[#306D29] border border-[#306D29]/20 rounded text-[9px] font-mono font-bold uppercase cursor-pointer"
                  title="Simulate Google Login as Main Admin (skbitservice@gmail.com)"
                >
                  🚀 Google Admin
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleLogin("customer@gmail.com")}
                  className="px-2 py-1 bg-gray-500/10 hover:bg-gray-500/20 text-gray-700 border border-gray-500/20 rounded text-[9px] font-mono font-bold uppercase cursor-pointer"
                  title="Simulate Google Login as customer@gmail.com"
                >
                  🚀 Google User
                </button>
              </div>
            )}

            {/* Phone connection trigger button */}
            {mode !== "phone-login" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("phone-login");
                  setOtpSent(false);
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#E7E2C9] hover:bg-[#DDD8BE] text-[#0d530e] border border-[#0d530e]/12 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
              >
                <PhoneCall size={14} className="text-[#306D29] shrink-0" />
                <span>Sign In via Mobile OTP SMS</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#E7E2C9] hover:bg-[#DDD8BE] text-[#0d530e] border border-[#0d530e]/12 rounded-xl font-bold font-sans text-xs flex items-center justify-center gap-2.5 transition shadow-sm cursor-pointer"
              >
                <Mail size={14} className="text-[#306D29] shrink-0" />
                <span>Return to Email and Password</span>
              </button>
            )}
          </div>

          {/* Auxiliary account toggles */}
          <div className="mt-6 flex flex-col gap-3 font-semibold text-center text-xs">
            {mode === "login" ? (
              <>
                <button onClick={() => setMode("signup")} className="text-[#306D29] hover:underline cursor-pointer">
                  Don't have a secure account? Create one &rarr;
                </button>
              </>
            ) : mode === "signup" ? (
              <button onClick={() => setMode("login")} className="text-[#306D29] hover:underline cursor-pointer">
                Have a registered account? Sign In &rarr;
              </button>
            ) : mode === "phone-login" ? (
              <button onClick={() => setMode("signup")} className="text-[#306D29] hover:underline cursor-pointer">
                New user? Create your account first &rarr;
              </button>
            ) : (
              <button onClick={() => setMode("login")} className="text-gray-500 hover:text-[#0D530E] flex items-center gap-1.5 justify-center cursor-pointer">
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
