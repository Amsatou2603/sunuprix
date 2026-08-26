import { creerApp } from "./app";
import { env } from "./config/env";

const app = creerApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[SunuPrix] API démarrée sur http://localhost:${env.port} (env: ${env.nodeEnv})`);
});
