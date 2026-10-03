"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Warehouse,
} from "lucide-react";
import { cn } from "@/lib/utils/format";
import { useRegister } from "@/lib/hooks/useAuth";

// ─── Step definitions ──────────────────────────────────────────────────────
type Step = "account" | "organisation" | "depot";

const STEPS: { id: Step; label: string; icon: typeof Building2 }[] = [
  { id: "account", label: "Votre compte", icon: User },
  { id: "organisation", label: "Organisation", icon: Building2 },
  { id: "depot", label: "Premier dépôt", icon: Warehouse },
];

// ─── Country list (Afrique francophone) ───────────────────────────────────
const PAYS = [
  { code: "BF", name: "Burkina Faso" },
  { code: "BI", name: "Burundi" },
  { code: "BJ", name: "Bénin" },
  { code: "CD", name: "Congo (RDC)" },
  { code: "CF", name: "Centrafrique" },
  { code: "CG", name: "Congo (Brazzaville)" },
  { code: "CI", name: "Côte d'Ivoire" },
  { code: "CM", name: "Cameroun" },
  { code: "DJ", name: "Djibouti" },
  { code: "GA", name: "Gabon" },
  { code: "GN", name: "Guinée" },
  { code: "GW", name: "Guinée-Bissau" },
  { code: "KM", name: "Comores" },
  { code: "MA", name: "Maroc" },
  { code: "MG", name: "Madagascar" },
  { code: "ML", name: "Mali" },
  { code: "MR", name: "Mauritanie" },
  { code: "MU", name: "Maurice" },
  { code: "NE", name: "Niger" },
  { code: "RW", name: "Rwanda" },
  { code: "SC", name: "Seychelles" },
  { code: "SN", name: "Sénégal" },
  { code: "TD", name: "Tchad" },
  { code: "TG", name: "Togo" },
  { code: "TN", name: "Tunisie" },
];

// ─── Component ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const [step, setStep] = useState<Step>("account");
  const [showPassword, setShowPassword] = useState(false);

  // Step 1: account
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2: organisation
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("SN");
  const [currency, setCurrency] = useState("XOF");

  // Step 3: dépôt
  const [depotName, setDepotName] = useState("");
  const [depotAddress, setDepotAddress] = useState("");

  const register = useRegister();

  // ─── Step navigation ─────────────────────────────────────────────────────
  const stepIndex = STEPS.findIndex((s) => s.id === step);

  function canAdvance(): boolean {
    if (step === "account") return !!email && !!password && password.length >= 8;
    if (step === "organisation") return !!orgName;
    return !!depotName;
  }

  function goNext() {
    if (step === "account") setStep("organisation");
    else if (step === "organisation") setStep("depot");
    else handleSubmit();
  }

  function goBack() {
    if (step === "organisation") setStep("account");
    else if (step === "depot") setStep("organisation");
  }

  // ─── Submit ──────────────────────────────────────────────────────────────
  function handleSubmit() {
    register.mutate({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      organization_name: orgName,
      country,
      currency,
      warehouse_name: depotName,
      warehouse_address: depotAddress || undefined,
    });
  }

  // ─── Error helper ─────────────────────────────────────────────────────────
  type ApiError = { response?: { data?: Record<string, string | string[]> } };
  const apiErrors =
    (register.error as ApiError | null)?.response?.data ?? {};
  const firstError = Object.values(apiErrors).flat()[0] as string | undefined;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
      {/* Header */}
      <div className="border-b border-zinc-800 px-8 py-6">
        <h1 className="text-xl font-semibold text-white">
          Créer votre organisation
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Configurez votre espace StockPro en 3 étapes
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 border-b border-zinc-800 px-8 py-4">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const isDone = i < stepIndex;
          const isActive = s.id === step;
          return (
            <div key={s.id} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors",
                    isDone
                      ? "bg-indigo-600 text-white"
                      : isActive
                      ? "bg-indigo-600/20 text-indigo-400 ring-1 ring-indigo-500"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  {isDone ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <Icon className="h-3.5 w-3.5" />
                  )}
                </div>
                <span
                  className={cn(
                    "hidden text-xs font-medium sm:block",
                    isActive ? "text-white" : "text-zinc-500"
                  )}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-3 h-px flex-1",
                    i < stepIndex ? "bg-indigo-600" : "bg-zinc-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="flex flex-col gap-5 px-8 py-6">
        {/* Global API error */}
        {register.isError && firstError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-rose-800/50 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{firstError}</span>
          </div>
        )}

        {/* ── Step 1: account ───────────────────────────────────────────── */}
        {step === "account" && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Prénom" id="first_name">
                <Input
                  id="first_name"
                  value={firstName}
                  onChange={setFirstName}
                  placeholder="Amadou"
                  autoComplete="given-name"
                />
              </Field>
              <Field label="Nom" id="last_name">
                <Input
                  id="last_name"
                  value={lastName}
                  onChange={setLastName}
                  placeholder="Diallo"
                  autoComplete="family-name"
                />
              </Field>
            </div>
            <Field label="Adresse email" id="email" required>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="vous@commerce.sn"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="Mot de passe" id="password" required hint="8 caractères minimum">
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={setPassword}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.length > 0 && password.length < 8 && (
                <p className="mt-1 text-xs text-rose-400">
                  Au moins 8 caractères requis.
                </p>
              )}
            </Field>
          </>
        )}

        {/* ── Step 2: organisation ──────────────────────────────────────── */}
        {step === "organisation" && (
          <>
            <Field label="Nom de l'organisation" id="org_name" required hint="Votre enseigne ou raison sociale">
              <Input
                id="org_name"
                value={orgName}
                onChange={setOrgName}
                placeholder="Distribution Diallo & Frères"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Pays" id="country">
                <select
                  id="country"
                  value={country}
                  onChange={(e) => {
                    const newCountry = e.target.value;
                    setCountry(newCountry);
                    if (["MA", "TN", "DZ"].includes(newCountry)) {
                      setCurrency("MAD");
                    } else {
                      setCurrency("XOF");
                    }
                  }}
                  className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                >
                  {PAYS.map((p) => (
                    <option key={p.code} value={p.code}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Devise" id="currency">
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50"
                >
                  <option value="XOF">FCFA — XOF</option>
                  <option value="XAF">FCFA — XAF</option>
                  <option value="MAD">Dirham — MAD</option>
                  <option value="USD">Dollar — USD</option>
                  <option value="EUR">Euro — EUR</option>
                </select>
              </Field>
            </div>
          </>
        )}

        {/* ── Step 3: dépôt ────────────────────────────────────────────── */}
        {step === "depot" && (
          <>
            <div className="mb-1 rounded-lg border border-zinc-700/50 bg-zinc-800/30 px-4 py-3 text-sm text-zinc-400">
              Vous pouvez ajouter d&apos;autres dépôts depuis les paramètres après la création.
            </div>
            <Field label="Nom du dépôt" id="depot_name" required hint="Ex. : Magasin principal, Entrepôt Nord">
              <Input
                id="depot_name"
                value={depotName}
                onChange={setDepotName}
                placeholder="Dépôt central"
                required
              />
            </Field>
            <Field label="Adresse" id="depot_address">
              <Input
                id="depot_address"
                value={depotAddress}
                onChange={setDepotAddress}
                placeholder="Rue 12, Quartier Commerce, Dakar"
              />
            </Field>
          </>
        )}

        {/* Navigation buttons */}
        <div className={cn("flex gap-3", stepIndex > 0 ? "justify-between" : "justify-end")}>
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              disabled={register.isPending}
              className="flex h-10 items-center gap-1.5 rounded-lg border border-zinc-700 px-4 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800 disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Retour
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canAdvance() || register.isPending}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:flex-none sm:px-6"
          >
            {register.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création…
              </>
            ) : step === "depot" ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Créer mon organisation
              </>
            ) : (
              <>
                Continuer
                <ChevronRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Login link */}
      <div className="border-t border-zinc-800 px-8 py-4 text-center">
        <p className="text-sm text-zinc-500">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="font-medium text-indigo-400 hover:text-indigo-300"
          >
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Small sub-components ──────────────────────────────────────────────────
function Field({
  label,
  id,
  required,
  hint,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function Input({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  className,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      autoComplete={autoComplete}
      required={required}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white placeholder-zinc-500 outline-none transition focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50",
        className
      )}
    />
  );
}
