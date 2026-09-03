import request from "supertest";
import { app, testEmail, cleanupTestData, disconnectPrisma } from "./helpers/testHelpers";

describe("Auth", () => {
  const createdUserIds: string[] = [];

  afterAll(async () => {
    await cleanupTestData({ userIds: createdUserIds });
    await disconnectPrisma();
  });

  it("registers a new user and returns an access token + refresh token", async () => {
    const email = testEmail("register");

    const res = await request(app)
      .post("/api/auth/register")
      .send({ name: "Test User", email, password: "password123" });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(email);
    expect(res.body.data.user).not.toHaveProperty("passwordHash");
    expect(typeof res.body.data.token).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");

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
    expect(typeof res.body.data.refreshToken).toBe("string");
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

  it("exchanges a valid refresh token for a new token pair", async () => {
    const email = testEmail("refresh");
    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Refresh Test", email, password: "password123" });
    createdUserIds.push(registered.body.data.user.id);
    const originalRefreshToken = registered.body.data.refreshToken;

    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: originalRefreshToken });

    expect(res.status).toBe(200);
    expect(typeof res.body.data.token).toBe("string");
    expect(typeof res.body.data.refreshToken).toBe("string");
    expect(res.body.data.refreshToken).not.toBe(originalRefreshToken);
  });

  it("rejects reusing a refresh token after it's been rotated", async () => {
    const email = testEmail("refresh-reuse");
    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Refresh Reuse Test", email, password: "password123" });
    createdUserIds.push(registered.body.data.user.id);
    const originalRefreshToken = registered.body.data.refreshToken;

    const first = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: originalRefreshToken });
    expect(first.status).toBe(200);

    const second = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: originalRefreshToken });
    expect(second.status).toBe(401);
  });

  it("rejects an invalid/unknown refresh token", async () => {
    const res = await request(app)
      .post("/api/auth/refresh")
      .send({ refreshToken: "not-a-real-refresh-token" });

    expect(res.status).toBe(401);
  });

  it("logout revokes the refresh token so it can no longer be used", async () => {
    const email = testEmail("logout");
    const registered = await request(app)
      .post("/api/auth/register")
      .send({ name: "Logout Test", email, password: "password123" });
    createdUserIds.push(registered.body.data.user.id);
    const { token, refreshToken } = registered.body.data;

    const logoutRes = await request(app)
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const refreshRes = await request(app).post("/api/auth/refresh").send({ refreshToken });
    expect(refreshRes.status).toBe(401);
  });
});
