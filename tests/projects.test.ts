import request from "supertest";
import {
  app,
  registerTestUser,
  cleanupTestData,
  disconnectPrisma,
} from "./helpers/testHelpers";

describe("Projects", () => {
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];

  afterAll(async () => {
    await cleanupTestData({ userIds: createdUserIds, projectIds: createdProjectIds });
    await disconnectPrisma();
  });

  it("creates a project and makes the creator its OWNER", async () => {
    const user = await registerTestUser("proj-create");
    createdUserIds.push(user.userId);

    const res = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Test Project", description: "Created by a test" });

    expect(res.status).toBe(201);
    expect(res.body.data.project.name).toBe("Test Project");
    expect(res.body.data.project.ownerId).toBe(user.userId);
    createdProjectIds.push(res.body.data.project.id);

    // Confirm the OWNER membership row really got created, not just the
    // project itself -- this is the whole point of createProject's
    // transaction.
    const listRes = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${user.token}`);
    const found = listRes.body.data.projects.find(
      (p: { id: string }) => p.id === res.body.data.project.id
    );
    expect(found._count.members).toBe(1);
  });

  it("rejects creating a project with no auth token", async () => {
    const res = await request(app)
      .post("/api/projects")
      .send({ name: "Should Not Be Created" });

    expect(res.status).toBe(401);
  });

  it("only returns projects the user is actually a member of", async () => {
    const userA = await registerTestUser("proj-list-a");
    const userB = await registerTestUser("proj-list-b");
    createdUserIds.push(userA.userId, userB.userId);

    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ name: "User A's Project" });
    createdProjectIds.push(createRes.body.data.project.id);

    const bList = await request(app)
      .get("/api/projects")
      .set("Authorization", `Bearer ${userB.token}`);

    const leaked = bList.body.data.projects.some(
      (p: { id: string }) => p.id === createRes.body.data.project.id
    );
    expect(leaked).toBe(false);
  });

  it("lets the owner update the project", async () => {
    const user = await registerTestUser("proj-update");
    createdUserIds.push(user.userId);

    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Original Name" });
    createdProjectIds.push(createRes.body.data.project.id);

    const updateRes = await request(app)
      .patch(`/api/projects/${createRes.body.data.project.id}`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Updated Name" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.project.name).toBe("Updated Name");
  });

  it("lets the owner delete the project", async () => {
    const user = await registerTestUser("proj-delete");
    createdUserIds.push(user.userId);

    const createRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "To Be Deleted" });
    const projectId = createRes.body.data.project.id;

    const deleteRes = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(deleteRes.status).toBe(200);

    const getRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${user.token}`);
    expect(getRes.status).toBe(403); // no longer a member -- project (and membership) is gone

    // Already deleted -- don't try to clean it up again in afterAll.
  });
});
