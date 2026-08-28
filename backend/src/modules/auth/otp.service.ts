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

/**
 * Extrait un résumé lisible d'une erreur Twilio pour les logs serveur —
 * jamais renvoyé tel quel au client (le SDK Twilio expose `code`/`status`
 * en plus du message, bien plus utile pour diagnostiquer que le message
 * générique affiché à l'utilisateur).
 */
function resumerErreurTwilio(erreur: unknown): string {
  if (erreur && typeof erreur === "object") {
    const { code, status, message } = erreur as { code?: unknown; status?: unknown; message?: unknown };
    return `code=${code ?? "?"} status=${status ?? "?"} message=${message ?? String(erreur)}`;
  }
  return String(erreur);
}

/** Déclenche l'envoi d'un code de vérification par SMS au numéro donné (E.164). */
export async function envoyerCodeOtp(telephone: string): Promise<void> {
  const twilioClient = obtenirClient();
  try {
    await twilioClient.verify.v2
      .services(env.twilioVerifyServiceSid as string)
      .verifications.create({ to: telephone, channel: "sms" });
  } catch (erreur) {
    // eslint-disable-next-line no-console
    console.error("[SunuPrix][otp] Échec envoi Twilio Verify —", resumerErreurTwilio(erreur));
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
  } catch (erreur) {
    // Un code déjà expiré, déjà utilisé, ou un numéro sans vérification en
    // cours : dans tous les cas Twilio répond par une erreur ou un statut
    // différent de "approved" — on retombe simplement sur "invalide", mais
    // on garde une trace serveur pour ne pas repartir à l'aveugle si ça
    // cache en fait un vrai problème de configuration.
    // eslint-disable-next-line no-console
    console.error("[SunuPrix][otp] Échec vérification Twilio Verify —", resumerErreurTwilio(erreur));
    return false;
  }
}
