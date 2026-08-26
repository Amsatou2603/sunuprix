/**
 * Client API centralisé.
 *
 * Toute requête vers le backend passe par ici — jamais un `fetch` direct
 * dispersé dans un composant. Cela garantit une seule base URL, une seule
 * gestion des credentials (cookie httpOnly de session) et une seule
 * normalisation des erreurs pour toute l'application.
 */

const URL_BASE_API = process.env.NEXT_PUBLIC_API_URL;

if (!URL_BASE_API && typeof window !== "undefined") {
  // Avertissement visible seulement côté client, pour ne pas casser le build.
  // eslint-disable-next-line no-console
  console.warn(
    "[SunuPrix] NEXT_PUBLIC_API_URL n'est pas défini — copiez frontend/.env.example vers .env.local.",
  );
}

/** Erreur API normalisée, avec le statut HTTP et le message renvoyé par le backend. */
export class ErreurApi extends Error {
  public readonly statut: number;
  public readonly details?: unknown;

  constructor(statut: number, message: string, details?: unknown) {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
    this.details = details;
  }
}

interface OptionsRequete {
  methode?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  corps?: unknown;
  /** Paramètres de requête ajoutés à l'URL. */
  parametres?: Record<string, string | number | boolean | undefined>;
}

function construireUrl(chemin: string, parametres?: OptionsRequete["parametres"]): string {
  const base = URL_BASE_API ?? "";
  const url = new URL(chemin.replace(/^\//, ""), base.endsWith("/") ? base : `${base}/`);
  if (parametres) {
    for (const [cle, valeur] of Object.entries(parametres)) {
      if (valeur !== undefined) url.searchParams.set(cle, String(valeur));
    }
  }
  return url.toString();
}

async function requete<T>(chemin: string, options: OptionsRequete = {}): Promise<T> {
  const { methode = "GET", corps, parametres } = options;

  const reponse = await fetch(construireUrl(chemin, parametres), {
    method: methode,
    headers: corps ? { "Content-Type": "application/json" } : undefined,
    // Indispensable pour transmettre le cookie httpOnly de session au backend,
    // y compris en cross-origin (Vercel <-> Render) en production.
    credentials: "include",
    body: corps ? JSON.stringify(corps) : undefined,
    cache: "no-store",
  });

  const texteBrut = await reponse.text();
  const donnees = texteBrut ? JSON.parse(texteBrut) : undefined;

  if (!reponse.ok) {
    const message = (donnees && (donnees.erreur as string)) || `Erreur HTTP ${reponse.status}`;
    throw new ErreurApi(reponse.status, message, donnees?.details);
  }

  return donnees as T;
}

/**
 * Variante binaire de `requete`, pour les réponses non-JSON (ex. export CSV
 * avec en-tête `Content-Disposition`) — mêmes credentials et normalisation
 * d'erreur que le reste du client, mais renvoie un `Blob` brut.
 */
async function requeteBlob(chemin: string, parametres?: OptionsRequete["parametres"]): Promise<Blob> {
  const reponse = await fetch(construireUrl(chemin, parametres), {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  if (!reponse.ok) {
    let message = `Erreur HTTP ${reponse.status}`;
    try {
      const donnees = JSON.parse(await reponse.text());
      message = donnees?.erreur ?? message;
    } catch {
      // Corps non-JSON (ou vide) : on garde le message générique.
    }
    throw new ErreurApi(reponse.status, message);
  }

  return reponse.blob();
}

export const apiClient = {
  get: <T>(chemin: string, parametres?: OptionsRequete["parametres"]) =>
    requete<T>(chemin, { methode: "GET", parametres }),
  post: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, { methode: "POST", corps }),
  patch: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, { methode: "PATCH", corps }),
  put: <T>(chemin: string, corps?: unknown) => requete<T>(chemin, { methode: "PUT", corps }),
  delete: <T>(chemin: string) => requete<T>(chemin, { methode: "DELETE" }),
  getBlob: (chemin: string, parametres?: OptionsRequete["parametres"]) => requeteBlob(chemin, parametres),
};
