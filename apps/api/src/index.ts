import { buildApp } from "./server.js";

const app = buildApp();

app
  .listen({
    port: Number(process.env.PORT) || 3000,
    host: "0.0.0.0",
  })
  .then((address) => {
    app.log.info(`Server listening on ${address}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
