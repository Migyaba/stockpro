"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Menu, X, ArrowRight, LayoutDashboard } from "lucide-react";
import { useAuthStore } from "@/lib/stores/authStore";
import { useHydrated } from "@/lib/hooks/useHydrated";
import { BrandMark } from "./BrandMark";
import { SIGNUP_LABEL, buttonPrimarySm, buttonSecondary } from "./styles";

const LINKS = [
  { href: "#fonctionnalites", label: "Fonctionnalités" },
  { href: "#pour-qui", label: "Pour qui" },
  { href: "#fonctionnement", label: "Comment ça marche" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

const linkClass =
  "rounded-full px-4 py-2 text-sm text-lp-ink-2 outline-none transition-colors hover:bg-white/[0.06] hover:text-lp-ink focus-visible:ring-2 focus-visible:ring-lp-brand-ink";

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { accessToken, user } = useAuthStore();
  const mounted = useHydrated();

  // Un repère en haut du document : quand il sort de l'écran, la page a
  // défilé et la pilule devient plus opaque.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsScrolled(!entry.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const isAuthenticated = mounted && !!accessToken;
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <div ref={sentinelRef} aria-hidden className="absolute top-0 left-0 h-4 w-px" />
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <div
          className={`mx-auto max-w-6xl rounded-[28px] border transition-[background-color,border-color,box-shadow] duration-300 ${
            isScrolled || mobileMenuOpen
              ? "border-white/[0.08] bg-[#141420]/85 shadow-[0_20px_40px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
              : "border-white/[0.05] bg-white/[0.03] backdrop-blur-md"
          }`}
        >
          <div className="flex h-14 items-center justify-between gap-4 pr-2 pl-4 sm:h-16 sm:pl-5">
            <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink">
              <BrandMark />
            </Link>

            <nav aria-label="Navigation principale" className="hidden items-center gap-1 lg:flex">
              {LINKS.map((link) => (
                <a key={link.href} href={link.href} className={`whitespace-nowrap ${linkClass}`}>
                  {link.label}
                </a>
              ))}
            </nav>

            <div className="hidden items-center gap-1 lg:flex">
              {isAuthenticated ? (
                <Link href="/dashboard" className={buttonPrimarySm}>
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span>Mon espace{user?.first_name ? ` (${user.first_name})` : ""}</span>
                </Link>
              ) : (
                <>
                  <Link href="/login" className={`whitespace-nowrap ${linkClass}`}>
                    Se connecter
                  </Link>
                  <Link href="/register" className={buttonPrimarySm}>
                    {SIGNUP_LABEL}
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full p-2.5 text-lp-ink-2 outline-none transition-colors hover:bg-white/[0.06] hover:text-lp-ink focus-visible:ring-2 focus-visible:ring-lp-brand-ink lg:hidden"
              aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div id="landing-mobile-menu" className="border-t border-white/[0.06] px-3 pt-2 pb-4 lg:hidden">
              <nav aria-label="Navigation mobile" className="flex flex-col">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className="rounded-xl px-3 py-3 text-base text-lp-ink-2 hover:bg-white/[0.05] hover:text-lp-ink"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-4">
                {isAuthenticated ? (
                  <Link href="/dashboard" onClick={closeMenu} className={`${buttonPrimarySm} w-full py-3`}>
                    <LayoutDashboard className="h-4 w-4" aria-hidden />
                    <span>Mon espace</span>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMenu} className={`${buttonSecondary} w-full`}>
                      Se connecter
                    </Link>
                    <Link href="/register" onClick={closeMenu} className={`${buttonPrimarySm} w-full py-3`}>
                      <span>{SIGNUP_LABEL}</span>
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
}
