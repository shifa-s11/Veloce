import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestServer, clearDatabase } from "./helpers/testServer.js";
import { prisma } from "../src/lib/prisma.js";

let app: any;

beforeAll(async () => {
  app = await createTestServer();
  await app.ready();
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

describe("Auth Module Integration Tests", () => {
  const testUser = {
    email: "john@example.com",
    password: "securepassword123",
    fullName: "John Doe",
  };

  describe("POST /api/v1/auth/signup", () => {
    it("should successfully sign up a new user with valid input", async () => {
      const res = await request(app.server)
        .post("/api/v1/auth/signup")
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
      expect(res.body.data.user.fullName).toBe(testUser.fullName);
      expect(res.body.data.user.password).toBeUndefined();
    });

    it("should reject signup with an already registered email", async () => {
      // Sign up first user
      await request(app.server)
        .post("/api/v1/auth/signup")
        .send(testUser);

      // Try signing up again with same email
      const res = await request(app.server)
        .post("/api/v1/auth/signup")
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("CONFLICT");
    });

    it("should reject signup with invalid input (e.g. short password)", async () => {
      const res = await request(app.server)
        .post("/api/v1/auth/signup")
        .send({
          email: "john@example.com",
          password: "123", // too short
          fullName: "John Doe",
        });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
      expect(res.body.error.details[0].field).toBe("password");
    });
  });

  describe("POST /api/v1/auth/login", () => {
    beforeEach(async () => {
      await request(app.server)
        .post("/api/v1/auth/signup")
        .send(testUser);
    });

    it("should login successfully with valid credentials and set cookies", async () => {
      const res = await request(app.server)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);

      // Verify cookies are set
      const cookiesHeader = res.headers["set-cookie"];
      const cookies = Array.isArray(cookiesHeader)
        ? cookiesHeader
        : cookiesHeader
        ? [cookiesHeader]
        : [];
      expect(cookies.some((c: string) => c.includes("accessToken"))).toBe(true);
      expect(cookies.some((c: string) => c.includes("refreshToken"))).toBe(true);
    });

    it("should fail login with incorrect password", async () => {
      const res = await request(app.server)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: "wrongpassword",
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/v1/auth/refresh", () => {
    let refreshToken: string;

    beforeEach(async () => {
      await request(app.server)
        .post("/api/v1/auth/signup")
        .send(testUser);

      const loginRes = await request(app.server)
        .post("/api/v1/auth/login")
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const cookiesHeader = loginRes.headers["set-cookie"];
      const cookies = Array.isArray(cookiesHeader)
        ? cookiesHeader
        : cookiesHeader
        ? [cookiesHeader]
        : [];
      const refreshCookie = cookies.find((c: string) => c.startsWith("refreshToken="));
      if (refreshCookie) {
        refreshToken = refreshCookie.split(";")[0].split("=")[1];
      }
    });

    it("should rotate JWT and return a new access token", async () => {
      expect(refreshToken).toBeDefined();

      const res = await request(app.server)
        .post("/api/v1/auth/refresh")
        .set("Cookie", [`refreshToken=${refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();

      const cookiesHeader = res.headers["set-cookie"];
      const cookies = Array.isArray(cookiesHeader)
        ? cookiesHeader
        : cookiesHeader
        ? [cookiesHeader]
        : [];
      expect(cookies.some((c: string) => c.includes("accessToken"))).toBe(true);
      expect(cookies.some((c: string) => c.includes("refreshToken"))).toBe(true);
    });

    it("should reject expired/invalid refresh tokens", async () => {
      const res = await request(app.server)
        .post("/api/v1/auth/refresh")
        .set("Cookie", ["refreshToken=invalid-token-here"]);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
