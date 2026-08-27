import { z } from "zod";

const schemaPointHistorique = z.object({
  date: z.string().min(1),
  prixFcfa: z.number(),
});

const schemaPredictionEntite = z
  .object({
    prixPredit: z.number(),
    margeErreurFcfa: z.number().nullable(),
  })
  .nullable();

const schemaEntite = z.object({
  label: z.string().trim().min(1).max(120),
  historique: z.array(schemaPointHistorique).max(500),
  prediction: schemaPredictionEntite,
});

export const schemaDiagnostic = z.object({
  mode: z.enum(["REGIONS", "PRODUITS"]),
  axeFixeLabel: z.string().trim().min(1).max(120),
  entites: z.array(schemaEntite).min(1).max(10),
});

export type EntreeDiagnostic = z.infer<typeof schemaDiagnostic>;
