import { prisma } from "../../src/lib/prisma.js";
import { buildApp } from "../../src/app.js";

export async function createTestServer() {
  // Ensure test environment variable defaults are set if not present
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/testdb";
  }
  if (!process.env.JWT_SECRET) {
    process.env.JWT_SECRET = "test-secret-at-least-32-characters-long";
  }
  if (!process.env.ADMIN_SECRET) {
    process.env.ADMIN_SECRET = "test-admin-secret-at-least-8-chars";
  }

  const app = await buildApp();
  return app;
}

export async function clearDatabase() {
  await prisma.refreshToken.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.user.deleteMany({});
}
