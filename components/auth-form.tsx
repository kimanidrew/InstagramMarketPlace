"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Eye, EyeOff, ArrowRight, ShoppingBag, ShieldCheck, Sparkles } from "lucide-react";
import { CommonModal, type CommonModalKind } from "@/components/common-modal";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<{kind: CommonModalKind; title: string; message: string} | null>(null);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (!error) return;
    const messages: Record<string, string> = {
      google_config: "Google sign-in isn't configured yet. Please try email and password, or contact the site administrator.",
      google_cancelled: "Google sign-in was cancelled. You can try again whenever you're ready.",
      google_state: "We couldn't verify this sign-in request. Please start again.",
      google_token: "Google couldn't complete sign-in. Please try again.",
      google_profile: "We couldn't retrieve your Google profile. Please try again.",
      google_email: "Please use a Google account with a verified email address.",
      google_error: "Something went wrong while signing in with Google. Please try again.",
    };
    setNotice({ kind: "error", title: "Sign-in couldn't be completed", message: messages[error] || "Please sign in again or use your email and password." });
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setNotice({ kind: "error", title: isSignup ? "Couldn't create your account" : "Couldn't sign you in", message: data.error || "Please check your details and try again." });
        return;
      }
      setNotice({ kind: "success", title: isSignup ? "Welcome to SokoLink!" : "You're signed in", message: isSignup ? "Your account is ready. Let's find something you'll love." : "Welcome back. Taking you to your account now." });
      window.setTimeout(() => { window.location.href = data.redirect || "/account"; }, 900);
    } catch {
      setNotice({ kind: "error", title: "Connection issue", message: "We couldn't reach SokoLink. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <main className="auth-page">
        <section className="auth-visual" style={{ backgroundImage: "linear-gradient(180deg, rgba(12,12,12,.08) 0%, rgba(12,12,12,.78) 100%), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=85')" }}>
          <Link href="/shop" className="auth-brand"><span className="auth-brand-mark"><ShoppingBag size={20} /></span><span>SokoLink</span></Link>
          <div className="auth-visual-copy">
            <span className="auth-kicker"><Sparkles size={14} /> YOUR NEXT GREAT FIND</span>
            <h2>Good finds.<br />Great people.<br /><em>One marketplace.</em></h2>
            <p>Discover independent shops, find pieces you love, and connect directly with the people behind them.</p>
            <div className="auth-trust"><ShieldCheck size={17} /> A more personal way to shop</div>
          </div>
          <span className="auth-photo-credit">Discover something different.</span>
        </section>
        <section className="auth-form-side">
          <div className="auth-form-wrap">
            <Link href="/shop" className="auth-mobile-brand"><span className="auth-brand-mark"><ShoppingBag size={18} /></span> SokoLink</Link>
            <div className="auth-heading">
              <span className="auth-kicker-light">{isSignup ? "A LITTLE SOMETHING NEW" : "NICE TO SEE YOU AGAIN"}</span>
              <h1>{isSignup ? "Make yourself at home." : "Welcome back."}</h1>
              <p>{isSignup ? "Create an account and start discovering shops worth knowing." : "Sign in to pick up where you left off."}</p>
            </div>
            <a href="/api/auth/google" className="auth-google-button" aria-label={isSignup ? "Sign up with Google" : "Sign in with Google"}>
              <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.02 13.22l7.98 6.19C11.93 13.72 17.47 9.5 24 9.5z" transform="translate(0 5) scale(.9)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.03 46.98 31.9 46.98 24.55z" transform="translate(0 2) scale(.9)"/><path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.6.28-3.14.77-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z" transform="translate(1 3) scale(.9)"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.53 0-12.07-4.22-14.05-10.09l-7.98 6.2C6.51 42.62 14.62 48 24 48z" transform="translate(0 0) scale(.9)"/></svg>
              Continue with Google
            </a>
            <div className="auth-divider"><span /> <small>OR WITH YOUR EMAIL</small> <span /></div>
            <form onSubmit={submit} className="auth-fields">
              {isSignup && <label className="auth-field"><span>Your name</span><input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} name="name" placeholder="How should we call you?" required /></label>}
              <label className="auth-field"><span>Email address</span><input autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" placeholder="you@example.com" required /></label>
              <label className="auth-field"><span>Password</span><span className="auth-password-wrap"><input autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} name="password" type={showPassword ? "text" : "password"} placeholder={isSignup ? "At least 8 characters" : "Enter your password"} minLength={isSignup ? 8 : undefined} required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} title={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
              {!isSignup && <div className="auth-forgot-hint">Your account, your way. Securely signed in.</div>}
              <button type="submit" disabled={busy} className="auth-submit">{busy ? "Please wait…" : isSignup ? "Create my account" : "Sign in"} {!busy && <ArrowRight size={17} />}</button>
            </form>
            <p className="auth-switch">{isSignup ? "Already part of SokoLink?" : "New to SokoLink?"} <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></p>
            <p className="auth-legal">By continuing, you agree to use SokoLink respectfully and keep your account details secure.</p>
          </div>
        </section>
      </main>
      <CommonModal open={!!notice} kind={notice?.kind} title={notice?.title || ""} message={notice?.message || ""} onClose={() => setNotice(null)} />
    </>
  );
}
