import Link from "next/link";
import { BrandMark } from "./BrandMark";
import { WHATSAPP_URL, container, textLink } from "./styles";

const columnClass = "md:border-l md:border-white/[0.07] md:pl-10";

export function LandingFooter() {
  return (
    <footer className="relative isolate overflow-hidden pt-16 pb-10 text-sm md:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-80 bg-[radial-gradient(45%_100%_at_50%_100%,rgb(79_70_229/0.45),transparent_75%)]"
      />
      <div className={container}>
        <div className="grid grid-cols-2 gap-10 pb-14 md:grid-cols-12 md:gap-0">
          <div className="col-span-2 md:col-span-5 md:pr-10">
            <Link href="/" className="inline-flex rounded-md outline-none focus-visible:ring-2 focus-visible:ring-lp-brand-ink">
              <BrandMark />
            </Link>
            <p className="mt-5 max-w-sm leading-relaxed text-lp-ink-2">
              Gestion de stock et de boutiques pour les commerçants, grossistes et distributeurs d&apos;Afrique
              francophone.
            </p>
          </div>

          <div className={`md:col-span-3 ${columnClass}`}>
            <h3 className="text-base font-medium text-lp-ink [font-family:var(--font-lp-display)]">Produit</h3>
            <ul className="mt-5 space-y-3">
              <li><a href="#fonctionnalites" className={textLink}>Fonctionnalités</a></li>
              <li><a href="#pour-qui" className={textLink}>Pour qui</a></li>
              <li><a href="#tarifs" className={textLink}>Tarifs</a></li>
              <li><a href="#faq" className={textLink}>FAQ</a></li>
            </ul>
          </div>

          <div className={`md:col-span-4 ${columnClass}`}>
            <h3 className="text-base font-medium text-lp-ink [font-family:var(--font-lp-display)]">Compte et contact</h3>
            <ul className="mt-5 space-y-3">
              <li><Link href="/login" className={textLink}>Se connecter</Link></li>
              <li><Link href="/register" className={textLink}>Créer un compte</Link></li>
              <li>
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className={textLink}>
                  WhatsApp <span className="whitespace-nowrap">+229 43 50 78 05</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.07] pt-8 text-lp-ink-2">
          <p>© {new Date().getFullYear()} StockPro. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
