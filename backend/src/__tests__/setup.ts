/**
 * Variables d'environnement minimales pour que `src/config/env.ts` (lu au
 * chargement de tout module applicatif) ne lève pas d'erreur "variable
 * manquante" pendant les tests. Aucune base de données réelle n'est
 * nécessaire : chaque test qui touche un module import Prisma via une
 * repository mocke explicitement cette repository (voir les fichiers de
 * test), donc `DATABASE_URL` n'est jamais réellement utilisée pour se
 * connecter — elle doit seulement être présente pour satisfaire la lecture
 * de configuration.
 */
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.DATABASE_URL = process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-secret-uniquement-pour-les-tests";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";
// GEMINI_API_KEY volontairement absente : les tests du chatbot vérifient le
// mode de repli local, qui est justement le comportement attendu sans clé.
delete process.env.GEMINI_API_KEY;
