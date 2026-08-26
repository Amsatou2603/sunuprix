/**
 * Les cinq régions couvertes par SunuPrix — liste fermée, définie une seule
 * fois ici et consommée par le script de seed (backend) et par l'interface
 * (frontend). Toute évolution de périmètre géographique se fait à cet
 * unique endroit.
 */
export const REGIONS = ["Dakar", "Saint-Louis", "Thiès", "Louga", "Kaolack"] as const;

export type NomRegion = (typeof REGIONS)[number];
