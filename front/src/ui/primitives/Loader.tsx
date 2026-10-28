/**
 * Loader PFO (fichier `public/brand/pfo-loader.svg`, 28/10/2026) : quatre segments du carré de la marque qui
 * s'allument tour à tour, un cœur qui respire. Rendu en ligne pour hériter de la couleur du thème.
 * Ne s'emploie que via `LoadingState` : un seul composant de chargement (règle 2).
 */
export function Loader({ size = 56 }: { size?: number }) {
  return (
    <svg className="loader" viewBox="0 0 100 100" width={size} height={size} aria-hidden="true" focusable="false">
      <rect className="loader__segment" x="10" y="10" width="62" height="18" />
      <rect className="loader__segment" x="72" y="10" width="18" height="62" />
      <rect className="loader__segment" x="28" y="72" width="62" height="18" />
      <rect className="loader__segment" x="10" y="28" width="18" height="62" />
      <rect className="loader__core" x="34" y="34" width="32" height="32" />
    </svg>
  );
}
