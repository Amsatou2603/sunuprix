import { z } from "zod";

export const schemaPublicationAnnonce = z.object({
  titre: z.string().trim().min(3, "Le titre doit contenir au moins 3 caractères.").max(150),
  contenu: z.string().trim().min(10, "Le contenu doit contenir au moins 10 caractères.").max(2000),
});

export type EntreePublicationAnnonce = z.infer<typeof schemaPublicationAnnonce>;
