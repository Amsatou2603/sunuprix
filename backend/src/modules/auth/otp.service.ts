import twilio from "twilio";
import { env } from "../../config/env";
import { ApiError } from "../../utils/ApiError";

/**
 * Vérification par SMS via Twilio Verify. Twilio gère lui-même la
 * génération, l'expiration et le nombre d'essais du code — on ne stocke
 * jamais de code de vérification en base de données.
 */

let client: ReturnType<typeof twilio> | undefined;

function obtenirClient() {
  if (!env.twilioAccountSid || !env.twilioAuthToken || !env.twilioVerifyServiceSid) {
    throw ApiError.nonConfigure(
      "La vérification par SMS n'est pas encore configurée sur ce serveur.",
    );
  }
  if (!client) {
    client = twilio(env.twilioAccountSid, env.twilioAuthToken);
  }
  return client;
}

/** Déclenche l'envoi d'un code de vérification par SMS au numéro donné (E.164). */
export async function envoyerCodeOtp(telephone: string): Promise<void> {
  const twilioClient = obtenirClient();
  try {
    await twilioClient.verify.v2
      .services(env.twilioVerifyServiceSid as string)
      .verifications.create({ to: telephone, channel: "sms" });
  } catch {
    throw ApiError.mauvaiseRequete(
      "Impossible d'envoyer le code de vérification. Vérifiez le numéro saisi et réessayez.",
    );
  }
}

/** Vérifie le code saisi par l'utilisateur auprès de Twilio Verify. */
export async function verifierCodeOtp(telephone: string, code: string): Promise<boolean> {
  const twilioClient = obtenirClient();
  try {
    const verification = await twilioClient.verify.v2
      .services(env.twilioVerifyServiceSid as string)
      .verificationChecks.create({ to: telephone, code });
    return verification.status === "approved";
  } catch {
    // Un code déjà expiré, déjà utilisé, ou un numéro sans vérification en
    // cours : dans tous les cas Twilio répond par une erreur ou un statut
    // différent de "approved" — on retombe simplement sur "invalide".
    return false;
  }
}
