import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env";
import type { Role } from "../config/constants";

/** Contenu (payload) encodé dans le JWT de session. */
export interface PayloadJwt {
  sub: string; // id utilisateur
  role: Role;
  email: string;
}

export function signerToken(payload: PayloadJwt): string {
  const options: SignOptions = { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifierToken(token: string): PayloadJwt {
  return jwt.verify(token, env.jwtSecret) as PayloadJwt;
}
