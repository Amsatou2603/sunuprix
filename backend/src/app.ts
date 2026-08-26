import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import routes from "./routes";
import { gestionnaireErreurs, routeInconnue } from "./middlewares/error.middleware";

/**
 * Construit l'application Express (sans démarrer le serveur HTTP), afin de
 * pouvoir la réutiliser telle quelle dans des tests d'intégration futurs.
 */
export function creerApp(): Application {
  const app = express();

  app.use(
    cors({
      origin: env.corsOrigins,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());

  app.use("/api", routes);

  app.use(routeInconnue);
  app.use(gestionnaireErreurs);

  return app;
}
