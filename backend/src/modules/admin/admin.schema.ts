import { z } from "zod";
import { ROLES } from "../../config/constants";

export const schemaChangementRole = z.object({
  role: z.enum([...ROLES] as [string, ...string[]]),
});

export const schemaChangementStatut = z.object({
  actif: z.boolean(),
});
