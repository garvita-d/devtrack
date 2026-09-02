import request from "supertest";
import { app, testEmail, cleanupTestData, disconnectPrisma } from "./helpers/testHelpers";

describe("Auth", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await cleanupTestData({ userIds: createdUserIds });
    await disconnectPrisma();
  });

  it("registers a new user and returns a token", async () => {
    const email = testEmail("register");

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.data.token).toBe("string");

    createdUserIds.push(res.body.data.user.id);
  });

  it("rejects registering the same email twice", async () => {
    const email = testEmail("duplicate");

    const first = await request(app)
      .post("/api/auth/register")
      .send({ name: "First", email, password: "password123" });
    expect(first.status).toBe(201);
    createdUserIds.push(first.body.data.user.id);

    const second = await request(app)
      .post("/api/auth/register")
      .send({ name: "Second", email, password: "password123" });

    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });

  it("logs in with valid credentials", async () => {
    const email = testEmail("login");
    const password = "password123";

    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Login Test", email, password });
    createdUserIds.push(registered.body.data.user.id);

    const res = await request(app).post("/api/auth/login").send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.token).toBe("string");
  });

  it("rejects login with the wrong password", async () => {
    const email = testEmail("wrongpass");

    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Wrong Pass", email, password: "password123" });
    createdUserIds.push(registered.body.data.user.id);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email, password: "not-the-right-password" });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a request to a protected route with an invalid JWT", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this-is-not-a-real-token");

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects a request to a protected route with no token at all", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(401);
  });
});
