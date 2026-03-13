import Fastify from "fastify";
import { serializerCompiler, validatorCompiler } from "fastify-type-provider-zod";
import cors from "@fastify/cors";
import healthRoutes from "./routes/health.js";
import eventsRoutes from "./routes/events.js";

export function buildApp() {
  const app = Fastify({ logger: false });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  app.register(cors, { origin: true });
  app.register(healthRoutes);
  app.register(eventsRoutes);

  return app;
}
