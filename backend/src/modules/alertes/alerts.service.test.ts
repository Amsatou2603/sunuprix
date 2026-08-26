import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Toutes les repositories touchées transitivement par `alerts.service.ts`
 * (directement, ou via `prix.service.ts`) sont mockées ici — cela évite de
 * charger `config/prisma.ts` (qui construit un vrai `PrismaClient`,
 * indisponible dans cet environnement sans `prisma generate`) et permet de
 * tester la logique métier pure du service en contrôlant entièrement les
 * données qu'il reçoit.
 */
vi.mock("../prix/prix.repository", () => ({
  trouverDeuxDerniersReleves: vi.fn(),
}));
vi.mock("../referentiel/referentiel.repository", () => ({
  trouverProduitParId: vi.fn(),
  trouverRegionParId: vi.fn(),
}));
vi.mock("./alertes.repository", () => ({
  listerActivesParUtilisateur: vi.fn(),
  listerParUtilisateur: vi.fn(),
  creer: vi.fn(),
  trouverParId: vi.fn(),
  mettreAJour: vi.fn(),
  supprimer: vi.fn(),
  mettreAJourSeverite: vi.fn(),
}));
vi.mock("./notifications.repository", () => ({
  listerParUtilisateur: vi.fn(),
  compterNonLues: vi.fn(),
  trouverDerniereParUtilisateur: vi.fn(),
  creer: vi.fn(),
  trouverParId: vi.fn(),
  marquerLue: vi.fn(),
}));
vi.mock("./configurationSeuils.repository", () => ({
  obtenirOuCreer: vi.fn(),
  mettreAJour: vi.fn(),
}));

import * as prixRepository from "../prix/prix.repository";
import * as referentielRepository from "../referentiel/referentiel.repository";
import * as alertesRepository from "./alertes.repository";
import * as notificationsRepository from "./notifications.repository";
import * as configurationSeuilsRepository from "./configurationSeuils.repository";
import { detecterEtNotifierPourUtilisateur, determinerSeverite } from "./alerts.service";

const CONFIG_SEUILS = { id: "config-1", seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 };

describe("determinerSeverite", () => {
  it("reste sous le seuil d'attention -> INFO", () => {
    expect(determinerSeverite(2, { seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 })).toBe("INFO");
  });

  it("atteint le seuil d'attention sans atteindre le seuil critique -> ATTENTION", () => {
    expect(determinerSeverite(5, { seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 })).toBe("ATTENTION");
    expect(determinerSeverite(9.9, { seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 })).toBe("ATTENTION");
  });

  it("atteint le seuil critique -> CRITIQUE", () => {
    expect(determinerSeverite(10, { seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 })).toBe("CRITIQUE");
    expect(determinerSeverite(25, { seuilAttentionPourcent: 5, seuilCritiquePourcent: 10 })).toBe("CRITIQUE");
  });
});

describe("detecterEtNotifierPourUtilisateur", () => {
  const ALERTE_ACTIVE = {
    id: "alerte-1",
    utilisateurId: "user-1",
    produitId: "produit-1",
    regionId: "region-1",
    seuilPourcent: 5,
    active: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(configurationSeuilsRepository.obtenirOuCreer).mockResolvedValue(CONFIG_SEUILS as never);
    vi.mocked(referentielRepository.trouverProduitParId).mockResolvedValue({
      id: "produit-1",
      nom: "Riz",
      unite: "kg",
    } as never);
    vi.mocked(referentielRepository.trouverRegionParId).mockResolvedValue({
      id: "region-1",
      nom: "Dakar",
    } as never);
  });

  it("crée une notification quand la variation dépasse le seuil critique", async () => {
    vi.mocked(alertesRepository.listerActivesParUtilisateur).mockResolvedValue([ALERTE_ACTIVE] as never);
    vi.mocked(notificationsRepository.trouverDerniereParUtilisateur).mockResolvedValue(null);
    // Dernier relevé 110 vs précédent 100 -> +10 %, au-delà du seuil critique (10 %).
    vi.mocked(prixRepository.trouverDeuxDerniersReleves).mockResolvedValue([
      { prixFcfa: 110, dateReleve: new Date("2026-02-01") },
      { prixFcfa: 100, dateReleve: new Date("2026-01-01") },
    ] as never);

    const nombreCreees = await detecterEtNotifierPourUtilisateur("user-1");

    expect(nombreCreees).toBe(1);
    expect(notificationsRepository.creer).toHaveBeenCalledTimes(1);
    expect(alertesRepository.mettreAJourSeverite).toHaveBeenCalledWith("alerte-1", "CRITIQUE");
  });

  it("ne crée rien quand la variation reste sous le seuil personnel de l'alerte", async () => {
    vi.mocked(alertesRepository.listerActivesParUtilisateur).mockResolvedValue([ALERTE_ACTIVE] as never);
    vi.mocked(notificationsRepository.trouverDerniereParUtilisateur).mockResolvedValue(null);
    // +2 % seulement, sous le seuil personnel de 5 %.
    vi.mocked(prixRepository.trouverDeuxDerniersReleves).mockResolvedValue([
      { prixFcfa: 102, dateReleve: new Date("2026-02-01") },
      { prixFcfa: 100, dateReleve: new Date("2026-01-01") },
    ] as never);

    const nombreCreees = await detecterEtNotifierPourUtilisateur("user-1");

    expect(nombreCreees).toBe(0);
    expect(notificationsRepository.creer).not.toHaveBeenCalled();
  });

  it("n'envoie pas deux fois la même notification (idempotence sur le titre)", async () => {
    vi.mocked(alertesRepository.listerActivesParUtilisateur).mockResolvedValue([ALERTE_ACTIVE] as never);
    vi.mocked(prixRepository.trouverDeuxDerniersReleves).mockResolvedValue([
      { prixFcfa: 110, dateReleve: new Date("2026-02-01") },
      { prixFcfa: 100, dateReleve: new Date("2026-01-01") },
    ] as never);
    // La dernière notification existante porte déjà le même titre que celui
    // qui serait généré pour cet événement -> ne doit pas être redoublée.
    vi.mocked(notificationsRepository.trouverDerniereParUtilisateur).mockResolvedValue({
      titre: "📈 Riz à Dakar : hausse de 10%",
    } as never);

    const nombreCreees = await detecterEtNotifierPourUtilisateur("user-1");

    expect(nombreCreees).toBe(0);
    expect(notificationsRepository.creer).not.toHaveBeenCalled();
  });

  it("ignore les alertes sans historique suffisant (moins de deux relevés)", async () => {
    vi.mocked(alertesRepository.listerActivesParUtilisateur).mockResolvedValue([ALERTE_ACTIVE] as never);
    vi.mocked(notificationsRepository.trouverDerniereParUtilisateur).mockResolvedValue(null);
    vi.mocked(prixRepository.trouverDeuxDerniersReleves).mockResolvedValue([
      { prixFcfa: 110, dateReleve: new Date("2026-02-01") },
    ] as never);

    const nombreCreees = await detecterEtNotifierPourUtilisateur("user-1");

    expect(nombreCreees).toBe(0);
    expect(notificationsRepository.creer).not.toHaveBeenCalled();
  });
});
