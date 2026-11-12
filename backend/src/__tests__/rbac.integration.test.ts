import { beforeAll, describe, expect, it, vi } from "vitest";
import request from "supertest";
import type { Application } from "express";

/**
 * Test d'intégration du contrôle d'accès par rôle, de bout en bout à travers
 * la vraie application Express (`creerApp()`, déjà pensée pour être
 * réutilisée dans des tests — voir son commentaire dans `app.ts`).
 *
 * `config/prisma.ts` est mocké une seule fois ici : toutes les repositories
 * de l'application importent `{ prisma }` depuis ce même fichier résolu, donc
 * ce mock unique suffit à éviter la construction d'un vrai `PrismaClient`
 * (impossible sans `prisma generate` dans cet environnement) pour
 * l'intégralité de l'arbre de modules chargé par `app.ts`. Comme le
 * middleware de rôle rejette une requête avant tout accès aux données, les
 * délégués factices n'ont même pas besoin d'être invoqués dans les cas de
 * refus testés ici — ils ne servent qu'à permettre l'import du graphe de
 * modules sans erreur.
 */
function delegueFactice() {
  return {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    create: async (args: { data?: unknown }) => ({ id: "fake-id", ...(args?.data as object) }),
    createMany: async () => ({ count: 0 }),
    update: async (args: { data?: unknown }) => ({ id: "fake-id", ...(args?.data as object) }),
    updateMany: async () => ({ count: 0 }),
    upsert: async () => ({ id: "fake-id" }),
    delete: async () => ({ id: "fake-id" }),
    deleteMany: async () => ({ count: 0 }),
    count: async () => 0,
  };
}

vi.mock("../config/prisma", () => ({
  prisma: {
    utilisateur: delegueFactice(),
    region: delegueFactice(),
    produit: delegueFactice(),
    relevePrix: delegueFactice(),
    prediction: delegueFactice(),
    alerte: delegueFactice(),
    notification: delegueFactice(),
    conversationChatbot: delegueFactice(),
    configurationSeuils: delegueFactice(),
    $queryRaw: async () => [],
    $disconnect: async () => undefined,
  },
}));

const TOUS_LES_ROLES = ["ADMIN", "ANALYSTE", "CONTRIBUTEUR", "CONSOMMATEUR"] as const;
type RoleTest = (typeof TOUS_LES_ROLES)[number];

let app: Application;
let signerToken: (payload: { sub: string; role: RoleTest; email: string }) => string;

beforeAll(async () => {
  // Imports dynamiques, après l'enregistrement du mock ci-dessus.
  const appModule = await import("../app");
  const jwtModule = await import("../utils/jwt");
  app = appModule.creerApp();
  signerToken = jwtModule.signerToken as typeof signerToken;
});

function tokenPour(role: RoleTest): string {
  return signerToken({ sub: `user-${role.toLowerCase()}`, role, email: `${role.toLowerCase()}@sunuprix.sn` });
}

interface EndpointProtege {
  methode: "get" | "post";
  chemin: string;
  roleAutorise: RoleTest;
}

const ENDPOINTS_PROTEGES: EndpointProtege[] = [
  { methode: "get", chemin: "/api/admin/utilisateurs", roleAutorise: "ADMIN" },
  { methode: "get", chemin: "/api/admin/declarations-prix", roleAutorise: "ADMIN" },
  { methode: "get", chemin: "/api/admin/seuils", roleAutorise: "ADMIN" },
  { methode: "get", chemin: "/api/export/csv", roleAutorise: "ANALYSTE" },
  { methode: "get", chemin: "/api/prix/declarations/mes", roleAutorise: "CONTRIBUTEUR" },
];

describe("Contrôle d'accès par rôle (RBAC) — de bout en bout via la vraie app Express", () => {
  it.each(ENDPOINTS_PROTEGES)(
    "refuse l'accès à $chemin ($roleAutorise uniquement) pour tout autre rôle",
    async ({ methode, chemin, roleAutorise }) => {
      const autresRoles = TOUS_LES_ROLES.filter((role) => role !== roleAutorise);

      for (const role of autresRoles) {
        const reponse = await request(app)[methode](chemin).set("Authorization", `Bearer ${tokenPour(role)}`);
        expect(reponse.status, `${role} ne devrait pas accéder à ${chemin}`).toBe(403);
      }
    },
  );

  it.each(ENDPOINTS_PROTEGES)("refuse l'accès à $chemin sans authentification (401)", async ({ methode, chemin }) => {
    const reponse = await request(app)[methode](chemin);
    expect(reponse.status).toBe(401);
  });

  it.each(ENDPOINTS_PROTEGES)(
    "laisse passer le rôle autorisé au-delà du contrôle d'accès pour $chemin",
    async ({ methode, chemin, roleAutorise }) => {
      const reponse = await request(app)[methode](chemin).set("Authorization", `Bearer ${tokenPour(roleAutorise)}`);
      // Le rôle correct ne doit jamais être bloqué par le contrôle d'accès —
      // qu'importe si la couche métier renvoie ensuite 200 (données vides,
      // cohérent avec le mock Prisma factice) ou une autre erreur non liée au rôle.
      expect(reponse.status).not.toBe(401);
      expect(reponse.status).not.toBe(403);
    },
  );


  // Consultation sans compte : un visiteur peut voir les prix et les prédictions.
  const ROUTES_CONSULTATION_PUBLIQUE = [
    "/api/regions",
    "/api/produits",
    "/api/prix/carte?produitId=p-test",
    "/api/prix/historique?produitId=p-test&regionId=r-test",
    "/api/predictions/p-test/r-test",
  ];

  it.each(ROUTES_CONSULTATION_PUBLIQUE)("laisse un visiteur sans compte consulter %s", async (chemin) => {
    const reponse = await request(app).get(chemin);
    expect(reponse.status).not.toBe(401);
    expect(reponse.status).not.toBe(403);
  });

  it("le référentiel reste accessible à tout rôle authentifié", async () => {
    for (const role of TOUS_LES_ROLES) {
      const reponse = await request(app).get("/api/regions").set("Authorization", `Bearer ${tokenPour(role)}`);
      expect(reponse.status).toBe(200);
    }
    const sansToken = await request(app).get("/api/regions");
    expect(sansToken.status).toBe(200);
  });

  // Un compte reste nécessaire dès qu'il s'agit de données personnelles ou d'une action.
  const ROUTES_COMPTE_REQUIS: Array<{ methode: "get" | "post"; chemin: string }> = [
    { methode: "get", chemin: "/api/alertes" },
    { methode: "post", chemin: "/api/alertes" },
    { methode: "get", chemin: "/api/notifications" },
    { methode: "post", chemin: "/api/chatbot" },
    { methode: "get", chemin: "/api/auth/moi" },
    { methode: "post", chemin: "/api/prix/declarations" },
    { methode: "post", chemin: "/api/analyse/diagnostic" },
  ];

  it.each(ROUTES_COMPTE_REQUIS)("exige un compte pour $methode $chemin (401 sans token)", async ({ methode, chemin }) => {
    const reponse = await request(app)[methode](chemin);
    expect(reponse.status).toBe(401);
  });
});
