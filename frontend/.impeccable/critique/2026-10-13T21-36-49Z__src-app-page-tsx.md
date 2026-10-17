---
target: landing StockPro
total_score: 25
max_score: 32
na_heuristics: 7,9
p0_count: 0
p1_count: 3
target_identity: "file:/home/miguel/Miguel/Projetweb/StockPro/frontend/src/app/page.tsx"
target_fingerprint: "sha256:252d6d3c65cb85ea609733b5c8e7408232f4f41d821d769df84183540b001378"
target_path: /home/miguel/Miguel/Projetweb/StockPro/frontend/src/app/page.tsx
timestamp: 2026-10-13T21-36-49Z
slug: src-app-page-tsx
closed: true
---
# Critique landing StockPro (src/app/page.tsx + components/landing)
Mode: Persuade. Cible: petite boutique, grande boutique, grossiste, chaîne multi-boutiques (Afrique de l'Ouest, FCFA). Référence: velora.colorlib.com/templates/saas.

## Scores (25/32, Good, n/a: 7, 9)
1 Visibilité 3 | 2 Monde réel 4 | 3 Contrôle 3 | 4 Cohérence 3 | 5 Prévention 3 | 6 Reconnaissance 3 | 7 n/a | 8 Esthétique 3 | 9 n/a | 10 Aide 3

## Priority issues
- [P1] Aucune preuve sociale (ni chiffres, ni témoignages, ni logos de paiement) -> $impeccable bolder / clarify
- [P1] Les 4 segments cibles ne sont pas adressés séparément -> $impeccable shape (section "Pour qui")
- [P1] Rythme plat: 7 sections de même poids, pas de point culminant entre le hero et les tarifs -> $impeccable layout + bolder + animate
- [P2] Tarifs: offre grossiste/chaîne cachée dans une phrase, limites (dépôts, membres) non dites -> $impeccable clarify
- [P2] Identité générique: Geist + icône lucide Package en guise de logo -> $impeccable typeset

## Minor
- Colonne "Aujourd'hui" en ink-3/70: lisible mais semble désactivée
- Menu mobile: pas de fermeture par Échap
- RolesSection sans id; pas de lien "Pour qui" dans la nav
- Lien "Documentation API" dans le footer marketing: hors cible
- CtaSection redéfinit les boutons au lieu de styles.ts
