"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useLogin } from "@/lib/hooks/useAuth";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("next") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const login = useLogin();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    login.mutate({ email, password });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-6">
        <h1 className="text-xl font-semibold text-white">Connexion</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Accédez à votre espace de gestion
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-8 py-6">
        {/* Error banner */}
        {login.isError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-800/50 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {(login.error as { response?: { data?: { detail?: string } } })?.response?.data
                ?.detail ?? "Email ou mot de passe incorrect."}
            </span>
          </div>
        )}

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="email"
            className="text-sm font-medium text-zinc-300"
          >
            Adresse email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className={cn(
              "h-10 w-full rounded-lg border bg-zinc-800/60 px-3 text-sm text-white placeholder-zinc-500 outline-none transition",
              "border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
              login.isError && "border-rose-700"
            )}
          />
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-300"
            >
              Mot de passe
            </label>
            <Link
              href="/reset-password"
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={cn(
                "h-10 w-full rounded-lg border bg-zinc-800/60 px-3 pr-10 text-sm text-white placeholder-zinc-500 outline-none transition",
                "border-zinc-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
                login.isError && "border-rose-700"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label={showPassword ? "Masquer" : "Afficher"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={login.isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {login.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion…
            </>
          ) : (
            "Se connecter"
          )}
        </button>

        {/* Separator */}
        <div className="relative flex items-center gap-3">
          <div className="h-px flex-1 bg-zinc-800" />
          <span className="text-xs text-zinc-600">ou</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        {/* Register link */}
        <p className="text-center text-sm text-zinc-500">
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Créer votre organisation
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
