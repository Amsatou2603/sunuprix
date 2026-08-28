/**
 * Erreur applicative typée, porteuse d'un code HTTP.
 *
 * Utilisée par les services et contrôleurs pour signaler un échec métier
 * (validation, autorisation, ressource introuvable, etc.) de façon uniforme,
 * capturée en un seul endroit par le middleware d'erreurs global.
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }

  static mauvaiseRequete(message: string, details?: unknown) {
    return new ApiError(400, message, details);
  }

  static nonAuthentifie(message = "Authentification requise.") {
    return new ApiError(401, message);
  }

  static acceIntedit(message = "Accès refusé pour ce rôle.") {
    return new ApiError(403, message);
  }

  static introuvable(message = "Ressource introuvable.") {
    return new ApiError(404, message);
  }

  static conflit(message: string) {
    return new ApiError(409, message);
  }

  static interne(message = "Erreur interne du serveur.") {
    return new ApiError(500, message);
  }

  /** Intégration tierce non configurée côté serveur (variables d'environnement manquantes). */
  static nonConfigure(message: string) {
    return new ApiError(503, message);
  }
}
