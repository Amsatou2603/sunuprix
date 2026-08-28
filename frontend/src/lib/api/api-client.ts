/**
 * Client API centralisé.
 *
 * Toute requête vers le backend passe par ici — jamais un `fetch` direct
 * dispersé dans un composant. Cela garantit un seul mécanisme de construction
 * d'URL, une seule gestion des credentials (cookie httpOnly de session) et
 * une seule normalisation des erreurs pour toute l'application.
 *
 * Toutes les requêtes utilisent un chemin RELATIF (ex. "/api/auth/moi"),
 * jamais l'URL absolue du backend Render : le rewrite serveur défini dans
 * `next.config.js` relaie chaque appel /api/* vers le vrai backend côté
 * serveur. Vu du navigateur, tout se passe sur le même domaine que la page
 * (sunuprix.vercel.app), ce qui rend le cookie de session "de première
 * partie" plutôt que "tiers" — indispensable pour que Safari/iOS (qui bloque
 * par défaut les cookies tiers, même avec SameSite=None; Secure) continue
 * d'envoyer ce cookie. Voir le commentaire dans next.config.js.
 */

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
  const cheminAbsolu = `/${chemin.replace(/^\//, "")}`;
  const recherche = new URLSearchParams();
  if (parametres) {
    for (const [cle, valeur] of Object.entries(parametres)) {
      if (valeur !== undefined) recherche.set(cle, String(valeur));
    }
  }
  const requete = recherche.toString();
  return requete ? `${cheminAbsolu}?${requete}` : cheminAbsolu;
}

async function requete<T>(chemin: string, options: OptionsRequete = {}): Promise<T> {
  const { methode = "GET", corps, parametres } = options;

  const reponse = await fetch(construireUrl(chemin, parametres), {
    method: methode,
    headers: corps ? { "Content-Type": "application/json" } : undefined,
    // Transmet le cookie httpOnly de session avec chaque requête. Depuis le
    // rewrite dans next.config.js, ces appels sont same-origin du point de
    // vue du navigateur — "include" reste la valeur la plus sûre dans tous
    // les cas de figure.
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
