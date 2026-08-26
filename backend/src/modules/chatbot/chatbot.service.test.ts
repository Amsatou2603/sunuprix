import { describe, expect, it, vi } from "vitest";
import type { ContexteChatbot } from "./chatbot.types";

// `chatbot.repository.ts` importe Prisma (indisponible sans `prisma generate`
// dans cet environnement) ; il n'est utilisé que par `envoyerMessage`, jamais
// par les fonctions de repli testées ici, donc un mock vide suffit à casser
// la chaîne d'import sans changer le comportement testé.
vi.mock("./chatbot.repository", () => ({
  trouverConversation: vi.fn(),
  creerConversation: vi.fn(),
  ajouterMessages: vi.fn(),
}));
// `chatbot.context.ts` (utilisé seulement par `envoyerMessage`, jamais par les
// fonctions de repli testées ici) importe lui aussi, transitivement, des
// repositories Prisma — mocké pour la même raison que ci-dessus.
vi.mock("./chatbot.context", () => ({
  construireContexte: vi.fn(),
}));

import { genererReponseAvecRepli, genererReponseRepli } from "./chatbot.service";

const CONTEXTE_AVEC_FAITS: ContexteChatbot = {
  produitMentionne: "Riz",
  regionMentionnee: "Dakar",
  faits: [
    {
      produit: "Riz",
      unite: "kg",
      region: "Dakar",
      prixActuelFcfa: 450,
      variationPourcent: 3.2,
      dateDernierReleve: "2026-02-01T00:00:00.000Z",
    },
  ],
  resume: "Riz à Dakar : 450 FCFA/kg (hausse de 3.2% par rapport au relevé précédent, au 01/02/2026).",
};

const CONTEXTE_SANS_FAITS: ContexteChatbot = {
  produitMentionne: null,
  regionMentionnee: null,
  faits: [],
  resume: "Aucune donnée de prix disponible pour construire une réponse précise.",
};

describe("genererReponseRepli (mode hors-ligne du chatbot)", () => {
  it("reformule le résumé factuel quand des faits sont disponibles", () => {
    const reponse = genererReponseRepli(CONTEXTE_AVEC_FAITS);

    expect(reponse).toContain("450 FCFA/kg");
    expect(reponse).toContain("Riz à Dakar");
    expect(reponse).toContain("fictives");
  });

  it("propose des exemples de questions quand aucun fait n'est trouvé", () => {
    const reponse = genererReponseRepli(CONTEXTE_SANS_FAITS);

    expect(reponse).toContain("Je n'ai pas trouvé de données");
    expect(reponse.length).toBeGreaterThan(0);
  });

  it("ne renvoie jamais de chaîne vide, quel que soit le contexte", () => {
    expect(genererReponseRepli(CONTEXTE_AVEC_FAITS).trim().length).toBeGreaterThan(0);
    expect(genererReponseRepli(CONTEXTE_SANS_FAITS).trim().length).toBeGreaterThan(0);
  });
});

describe("genererReponseAvecRepli (bascule automatique sans erreur visible)", () => {
  it("bascule sur le mode de repli local quand GEMINI_API_KEY est absente (comportement de cet environnement de test)", async () => {
    // `setup.ts` supprime explicitement GEMINI_API_KEY : l'appel Gemini doit
    // donc échouer silencieusement et retomber sur le mode local, sans jamais
    // propager d'erreur à l'appelant.
    const resultat = await genererReponseAvecRepli("Quel est le prix du riz à Dakar ?", CONTEXTE_AVEC_FAITS);

    expect(resultat.source).toBe("REPLI_LOCAL");
    expect(resultat.texte.length).toBeGreaterThan(0);
  });

  it("ne lève jamais d'exception même avec un contexte vide", async () => {
    await expect(genererReponseAvecRepli("bonjour", CONTEXTE_SANS_FAITS)).resolves.toMatchObject({
      source: "REPLI_LOCAL",
    });
  });
});
