import React, { FormEvent, useState } from "react";
import { ArrowRight, BarChart3, Check, Lock, WalletCards } from "lucide-react";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";

type AuthMode = "login" | "register";

const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    try {
      if (mode === "register") {
        await register({
          email,
          password,
          firstName: String(data.get("firstName") || "").trim(),
          lastName: String(data.get("lastName") || "").trim(),
        });
      } else {
        await login({ email, password });
      }
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "We couldn't connect to FinTrackr. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white lg:grid lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden border-r border-white/10 p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-slate-950 to-emerald-500/10" />
        <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/20">
              <WalletCards aria-hidden="true" size={23} />
            </div>
            <span className="text-xl font-semibold tracking-tight">FinTrackr</span>
          </div>
        </div>

        <div className="relative max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-blue-300">
            Your finances, made clear
          </p>
          <h1 className="text-5xl font-semibold leading-tight tracking-tight">
            Make every dollar part of a better plan.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Bring balances, spending, budgets, and monthly trends into one private
            workspace built around your financial picture.
          </p>
          <ul className="mt-10 grid gap-4 text-sm text-slate-200">
            {[
              "Live balances calculated from your transactions",
              "Monthly budgets with clear progress tracking",
              "Private data isolated to your account",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check aria-hidden="true" size={14} />
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-sm text-slate-400">
          <Lock aria-hidden="true" size={16} />
          Your session stays in this browser tab.
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 text-slate-900 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <BarChart3 aria-hidden="true" size={21} />
            </div>
            <span className="text-xl font-semibold">FinTrackr</span>
          </div>

          <div className="mb-8">
            <p className="text-sm font-semibold text-blue-600">
              {mode === "login" ? "Welcome back" : "Create your workspace"}
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              {mode === "login" ? "Sign in to FinTrackr" : "Start tracking with clarity"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {mode === "login"
                ? "Use your account to view your live financial dashboard."
                : "Create an account to keep your financial data private and organized."}
            </p>
          </div>

          <div className="mb-7 grid grid-cols-2 rounded-xl bg-slate-200/70 p-1" aria-label="Authentication mode">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              aria-pressed={mode === "login"}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("register")}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-white text-slate-950 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              aria-pressed={mode === "register"}
            >
              Create account
            </button>
          </div>

          <form
            className="space-y-5"
            onSubmit={handleSubmit}
            aria-label={mode === "login" ? "Sign in form" : "Create account form"}
          >
            {mode === "register" && (
              <div className="grid grid-cols-2 gap-4">
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  First name
                  <input
                    className="input-field bg-white"
                    name="firstName"
                    autoComplete="given-name"
                    maxLength={80}
                    required
                  />
                </label>
                <label className="grid gap-2 text-sm font-medium text-slate-700">
                  Last name
                  <input
                    className="input-field bg-white"
                    name="lastName"
                    autoComplete="family-name"
                    maxLength={80}
                    required
                  />
                </label>
              </div>
            )}

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Email address
              <input
                className="input-field bg-white"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Password
              <input
                className="input-field bg-white"
                name="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                minLength={8}
                maxLength={128}
                placeholder="At least 8 characters"
                required
              />
            </label>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white shadow-lg shadow-blue-600/15 transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? mode === "login"
                  ? "Signing in…"
                  : "Creating account…"
                : mode === "login"
                ? "Sign in"
                : "Create account"}
              {!submitting && <ArrowRight aria-hidden="true" size={18} />}
            </button>
          </form>

          <p className="mt-8 text-center text-xs leading-5 text-slate-500">
            FinTrackr stores your access token only for the lifetime of this browser tab.
          </p>
        </div>
      </section>
    </main>
  );
};

export default AuthPage;
