import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/format";

// Briques communes aux écrans publics (connexion, mot de passe oublié, invitation).

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/80 shadow-2xl backdrop-blur-sm">
      <div className="border-b border-zinc-800 px-8 py-6">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
      </div>
      <div className="flex flex-col gap-5 px-8 py-6">{children}</div>
    </div>
  );
}

export function AuthField({
  label,
  id,
  ...input
}: { label: string; id: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        {...input}
        className={cn(
          "h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 text-sm text-white placeholder-zinc-500 outline-none transition",
          "focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 disabled:opacity-60"
        )}
      />
    </div>
  );
}

export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success" | "warning";
  children: React.ReactNode;
}) {
  const styles = {
    error: "border-rose-800/50 bg-rose-950/50 text-rose-300",
    success: "border-emerald-800/50 bg-emerald-950/50 text-emerald-300",
    warning: "border-amber-800/50 bg-amber-950/50 text-amber-300",
  }[variant];
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm", styles)}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export function AuthSubmit({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-600 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

export function AuthLoading() {
  return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
    </div>
  );
}
