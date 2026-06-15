import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const start = async () => {
  try {
    const app = await buildApp();
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
    app.log.info(`🚀 Server listening on port ${env.PORT}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
