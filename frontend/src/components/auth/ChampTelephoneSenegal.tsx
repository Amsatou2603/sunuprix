import { DrapeauSenegal } from "./DrapeauSenegal";

interface ProprietesChampTelephoneSenegal {
  id?: string;
  /** Les 9 chiffres nationaux uniquement, sans l'indicatif +221. */
  valeur: string;
  onChange: (chiffres: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

/** Regroupe les chiffres pour un affichage lisible : "77 123 45 67". */
export function formaterAffichage(chiffres: string): string {
  const groupes = [2, 3, 2, 2];
  const parties: string[] = [];
  let reste = chiffres;
  for (const taille of groupes) {
    if (!reste) break;
    parties.push(reste.slice(0, taille));
    reste = reste.slice(taille);
  }
  return parties.join(" ");
}

/**
 * Champ de saisie du numéro de téléphone sénégalais : drapeau + indicatif
 * "+221" fixes, suivis des 9 chiffres nationaux formatés au fil de la saisie.
 * La valeur E.164 complète (`+221XXXXXXXXX`) se reconstruit chez l'appelant.
 */
export function ChampTelephoneSenegal({
  id,
  valeur,
  onChange,
  disabled,
  autoFocus,
}: ProprietesChampTelephoneSenegal) {
  return (
    <div className="flex overflow-hidden rounded-lg border border-black/10 bg-white transition focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
      <span className="flex select-none items-center gap-2 border-r border-black/10 bg-header/[0.03] px-3 text-sm font-semibold text-header/80">
        <DrapeauSenegal className="h-3.5 w-5 rounded-[2px] shadow-sm" />
        +221
      </span>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel-national"
        required
        disabled={disabled}
        autoFocus={autoFocus}
        placeholder="77 123 45 67"
        value={formaterAffichage(valeur)}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 9))}
        className="w-full bg-transparent px-3.5 py-2.5 text-sm text-header placeholder:text-header/40 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}
