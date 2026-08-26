export function Footer() {
  return (
    <footer className="border-t border-black/5 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-header/60 sm:px-6">
        <p>
          SunuPrix — projet de fin de formation. Toutes les données affichées (prix, régions, utilisateurs de
          démonstration) sont fictives et générées à des fins pédagogiques.
        </p>
        <p className="mt-1">© {new Date().getFullYear()} SunuPrix.</p>
      </div>
    </footer>
  );
}
