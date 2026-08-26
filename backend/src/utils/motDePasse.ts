import bcrypt from "bcrypt";
import { env } from "../config/env";

/** Hache un mot de passe en clair avec le nombre de rounds configuré. */
export async function hacherMotDePasse(motDePasseEnClair: string): Promise<string> {
  return bcrypt.hash(motDePasseEnClair, env.bcryptSaltRounds);
}

/** Compare un mot de passe en clair à un hash bcrypt stocké en base. */
export async function verifierMotDePasse(motDePasseEnClair: string, hash: string): Promise<boolean> {
  return bcrypt.compare(motDePasseEnClair, hash);
}
