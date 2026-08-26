import { z } from "zod";

export const schemaDeclarationPrix = z.object({
  produitId: z.string().min(1, "produitId est requis."),
  regionId: z.string().min(1, "regionId est requis."),
  prixFcfa: z.coerce.number().positive("Le prix doit être strictement positif."),
  // Optionnelle : la date de constatation du prix par le vendeur (par défaut, maintenant).
  dateReleve: z.coerce.date().optional(),
});

export const schemaRequeteHistorique = z.object({
  produitId: z.string().min(1, "produitId est requis."),
  regionId: z.string().min(1, "regionId est requis."),
});

export const schemaRequeteCarte = z.object({
  produitId: z.string().min(1, "produitId est requis."),
});

export type EntreeDeclarationPrix = z.infer<typeof schemaDeclarationPrix>;
