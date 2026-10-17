// Classes partagées par les sections de la landing. Rayons : boutons et
// pastilles en pilule, panneaux en rounded-2xl / rounded-3xl.

export const SIGNUP_LABEL = "Essai gratuit 7 jours";
export const WHATSAPP_URL = "https://wa.me/22943507805";

const focusRing =
  "outline-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink focus-visible:ring-offset-2 focus-visible:ring-offset-lp-page";

const buttonShape =
  "group inline-flex items-center justify-center gap-3 rounded-full font-medium whitespace-nowrap transition-[background-color,border-color,transform,box-shadow] duration-200 active:scale-[0.98] motion-reduce:transition-none motion-reduce:active:scale-100 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const primary = "bg-lp-brand text-white shadow-lp-glow hover:bg-lp-brand-hover";

// Bouton principal : pilule indigo avec la puce ✦ à droite (cf. ButtonChip).
export const buttonPrimary = `${buttonShape} ${focusRing} ${primary} py-2 pr-2 pl-6 text-[15px]`;

export const buttonPrimarySm = `${buttonShape} ${focusRing} ${primary} px-5 py-2 text-sm`;

export const buttonSecondary = `${buttonShape} ${focusRing} border border-white/10 bg-white/[0.04] px-6 py-3 text-[15px] text-lp-ink hover:border-white/20 hover:bg-white/[0.08]`;

export const textLink = `rounded-sm text-lp-ink-2 transition-colors hover:text-lp-ink ${focusRing}`;

export const container = "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8";

export const sectionTitle =
  "text-[2rem] sm:text-4xl lg:text-5xl leading-[1.1] font-medium tracking-[-0.02em] text-lp-ink text-balance";

// Panneau sombre légèrement relevé, utilisé par les cartes et maquettes.
export const card = "rounded-3xl border border-white/[0.07] bg-lp-surface/80";
