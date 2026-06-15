import request from "supertest";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestServer, clearDatabase } from "./helpers/testServer.js";
import { prisma } from "../src/lib/prisma.js";

let app: any;
let userAToken: string;
let userACookie: string;
let userBToken: string;
let userBCookie: string;
let userAId: string;
let userBId: string;

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

  // Create and login User A
  const signupA = await request(app.server)
    .post("/api/v1/auth/signup")
    .send({
      email: "user_a@example.com",
      password: "password123",
      fullName: "User A",
    });
  userAId = signupA.body.data.user.id;

  const loginA = await request(app.server)
    .post("/api/v1/auth/login")
    .send({
      email: "user_a@example.com",
      password: "password123",
    });
  userAToken = loginA.body.data.accessToken;
  const cookiesA = loginA.headers["set-cookie"] || [];
  userACookie = cookiesA.find((c: string) => c.startsWith("accessToken=")) || "";

  // Create and login User B
  const signupB = await request(app.server)
    .post("/api/v1/auth/signup")
    .send({
      email: "user_b@example.com",
      password: "password123",
      fullName: "User B",
    });
  userBId = signupB.body.data.user.id;

  const loginB = await request(app.server)
    .post("/api/v1/auth/login")
    .send({
      email: "user_b@example.com",
      password: "password123",
    });
  userBToken = loginB.body.data.accessToken;
  const cookiesB = loginB.headers["set-cookie"] || [];
  userBCookie = cookiesB.find((c: string) => c.startsWith("accessToken=")) || "";
});

describe("Tasks Module Integration Tests", () => {
  const newTask = {
    title: "Finish testing assessment",
    description: "Write backend and frontend tests",
    status: "TODO",
    priority: "HIGH",
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  };

  describe("POST /api/v1/tasks", () => {
    it("should successfully create a task for authenticated user", async () => {
      const res = await request(app.server)
        .post("/api/v1/tasks")
        .set("Cookie", [userACookie])
        .send(newTask);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.title).toBe(newTask.title);
      expect(res.body.data.userId).toBe(userAId);
    });

    it("should fail validation if title is empty", async () => {
      const res = await request(app.server)
        .post("/api/v1/tasks")
        .set("Cookie", [userACookie])
        .send({ ...newTask, title: "" });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/v1/tasks (List with filters/isolation)", () => {
    let taskAId: string;

    beforeEach(async () => {
      // User A creates a task
      const res = await request(app.server)
        .post("/api/v1/tasks")
        .set("Cookie", [userACookie])
        .send(newTask);
      taskAId = res.body.data.id;
    });

    it("should list tasks belonging to User A", async () => {
      const res = await request(app.server)
        .get("/api/v1/tasks")
        .set("Cookie", [userACookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(taskAId);
    });

    it("should return empty list for User B (User isolation check)", async () => {
      const res = await request(app.server)
        .get("/api/v1/tasks")
        .set("Cookie", [userBCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(0);
    });
  });

  describe("PATCH /api/v1/tasks/:id", () => {
    let taskAId: string;

    beforeEach(async () => {
      const res = await request(app.server)
        .post("/api/v1/tasks")
        .set("Cookie", [userACookie])
        .send(newTask);
      taskAId = res.body.data.id;
    });

    it("should update user A's own task status", async () => {
      const res = await request(app.server)
        .patch(`/api/v1/tasks/${taskAId}`)
        .set("Cookie", [userACookie])
        .send({ status: "IN_PROGRESS" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe("IN_PROGRESS");
    });

    it("should prevent User B from updating User A's task", async () => {
      const res = await request(app.server)
        .patch(`/api/v1/tasks/${taskAId}`)
        .set("Cookie", [userBCookie])
        .send({ status: "DONE" });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("DELETE /api/v1/tasks/:id", () => {
    let taskAId: string;

    beforeEach(async () => {
      const res = await request(app.server)
        .post("/api/v1/tasks")
        .set("Cookie", [userACookie])
        .send(newTask);
      taskAId = res.body.data.id;
    });

    it("should prevent User B from deleting User A's task", async () => {
      const res = await request(app.server)
        .delete(`/api/v1/tasks/${taskAId}`)
        .set("Cookie", [userBCookie]);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it("should allow User A to delete their own task", async () => {
      const res = await request(app.server)
        .delete(`/api/v1/tasks/${taskAId}`)
        .set("Cookie", [userACookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify task deleted
      const check = await request(app.server)
        .get(`/api/v1/tasks/${taskAId}`)
        .set("Cookie", [userACookie]);
      expect(check.status).toBe(404);
    });
  });
});
