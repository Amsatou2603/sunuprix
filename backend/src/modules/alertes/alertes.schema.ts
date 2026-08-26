import { z } from "zod";

export const schemaCreationAlerte = z.object({
  produitId: z.string().min(1, "produitId est requis."),
  regionId: z.string().min(1, "regionId est requis."),
  seuilPourcent: z.coerce.number().positive().optional(),
});

export const schemaMiseAJourAlerte = z.object({
  active: z.boolean().optional(),
  seuilPourcent: z.coerce.number().positive().optional(),
});

export const schemaConfigurationSeuils = z.object({
  seuilAttentionPourcent: z.coerce.number().positive(),
  seuilCritiquePourcent: z.coerce.number().positive(),
});
