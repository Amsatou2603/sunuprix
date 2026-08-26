import type { PayloadJwt } from "../utils/jwt";

// Étend le type Request d'Express pour porter l'utilisateur authentifié,
// attaché par `auth.middleware.ts`, et consommé par `role.middleware.ts`
// ainsi que par tous les contrôleurs protégés.
declare global {
  namespace Express {
    interface Request {
      utilisateurCourant?: PayloadJwt;
    }
  }
}

export {};
