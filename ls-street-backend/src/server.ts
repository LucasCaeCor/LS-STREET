import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./database/prisma.js";

const app = await buildApp();

async function shutdown(signal: string) {
  app.log.info(`Encerrando servidor: ${signal}`);

  await app.close();
  await prisma.$disconnect();

  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

try {
  await prisma.$connect();

  await app.listen({
    host: env.HOST,
    port: env.PORT,
  });

  app.log.info(`LS Street API executando na porta ${env.PORT}`);
} catch (error) {
  app.log.error(error);

  await prisma.$disconnect();

  process.exit(1);
}