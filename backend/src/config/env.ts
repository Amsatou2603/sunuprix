import "dotenv/config";

/**
 * Lecture et validation centralisées des variables d'environnement.
 *
 * Toute variable d'environnement utilisée par le backend DOIT être lue ici,
 * une seule fois, et exposée via l'objet `env` — jamais via `process.env`
 * dispersé dans le reste du code. Cela évite les valeurs codées en dur et
 * rend explicite la configuration attendue (voir `.env.example`).
 */

function lireVariable(nom: string, valeurParDefaut?: string): string {
  const valeur = process.env[nom] ?? valeurParDefaut;
  if (valeur === undefined) {
    throw new Error(
      `Variable d'environnement manquante : ${nom}. Copiez .env.example vers .env et complétez-la.`,
    );
  }
  return valeur;
}

function lireEntier(nom: string, valeurParDefaut: number): number {
  const brut = process.env[nom];
  if (brut === undefined || brut.trim() === "") return valeurParDefaut;
  const valeur = Number.parseInt(brut, 10);
  if (Number.isNaN(valeur)) {
    throw new Error(`Variable d'environnement invalide (entier attendu) : ${nom}`);
  }
  return valeur;
}

export const env = {
  nodeEnv: lireVariable("NODE_ENV", "development"),
  port: lireEntier("PORT", 4000),
  databaseUrl: lireVariable("DATABASE_URL"),
  jwtSecret: lireVariable("JWT_SECRET"),
  jwtExpiresIn: lireVariable("JWT_EXPIRES_IN", "7d"),
  bcryptSaltRounds: lireEntier("BCRYPT_SALT_ROUNDS", 10),
  /** Liste des origines autorisées en CORS, séparées par des virgules dans .env */
  corsOrigins: lireVariable("CORS_ORIGIN", "http://localhost:3000")
    .split(",")
    .map((origine) => origine.trim())
    .filter(Boolean),
  geminiApiKey:
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_AI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    undefined,
  geminiModel: lireVariable("GEMINI_MODEL", "gemini-3.6-flash"),

  // --- Connexion avec Google (Google Identity Services) -------------------
  // Optionnelle : en son absence, l'endpoint /api/auth/google répond 501 et
  // le bouton "Continuer avec Google" reste affiché mais informe l'utilisateur
  // que la fonctionnalité n'est pas encore configurée — jamais d'erreur 500.
  googleClientId: process.env.GOOGLE_CLIENT_ID || undefined,

  // --- Vérification par SMS (Twilio Verify) --------------------------------
  // Optionnelles pour la même raison : sans ces trois variables, /api/auth/otp/*
  // répond 501 plutôt que de planter.
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || undefined,
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || undefined,
  twilioVerifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || undefined,
} as const;


export const estProduction = env.nodeEnv === "production";
