/** Drapeau du Sénégal (vert / jaune / rouge, étoile verte au centre), pour le champ téléphone. */
export function DrapeauSenegal({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 3 2" aria-hidden="true">
      <rect x="0" width="1" height="2" fill="#00853F" />
      <rect x="1" width="1" height="2" fill="#FDEF42" />
      <rect x="2" width="1" height="2" fill="#E31B23" />
      <text x="1.5" y="1.18" fontSize="0.62" textAnchor="middle" fill="#00853F">
        ★
      </text>
    </svg>
  );
}
