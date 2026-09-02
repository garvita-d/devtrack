import request from "supertest";
import {
  app,
  registerTestUser,
  cleanupTestData,
  disconnectPrisma,
} from "./helpers/testHelpers";

describe("Authorization (RBAC)", () => {
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];

  afterAll(async () => {
    await cleanupTestData({ userIds: createdUserIds, projectIds: createdProjectIds });
    await disconnectPrisma();
  });

  // Shared fixture: an owner's project with one ADMIN and one plain MEMBER
  // added to it. Reused across several tests below.
  async function setupProjectWithRoles() {
    const owner = await registerTestUser("rbac-owner");
    const admin = await registerTestUser("rbac-admin");
    const member = await registerTestUser("rbac-member");
    createdUserIds.push(owner.userId, admin.userId, member.userId);

    const projectRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "RBAC Test Project" });
    const projectId = projectRes.body.data.project.id;
    createdProjectIds.push(projectId);

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ userId: admin.userId, role: "ADMIN" });

    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ userId: member.userId, role: "MEMBER" });

    return { owner, admin, member, projectId };
  }

  it("owner can delete the project", async () => {
    const { owner, projectId } = await setupProjectWithRoles();

    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${owner.token}`);

    expect(res.status).toBe(200);
    createdProjectIds.splice(createdProjectIds.indexOf(projectId), 1); // already gone
  });

  it("a plain member cannot delete the project", async () => {
    const { member, projectId } = await setupProjectWithRoles();

    const res = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set("Authorization", `Bearer ${member.token}`);

    expect(res.status).toBe(403);
  });

  it("an admin can create and update issues that aren't their own", async () => {
    const { admin, member, projectId } = await setupProjectWithRoles();

    // The plain member creates an issue.
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/issues`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({ title: "Member's issue" });
    const issueId = createRes.body.data.issue.id;

    // The admin, despite not being the creator or assignee, can still
    // update it -- ADMIN bypasses the ownership check in assertCanMutateIssue.
    const updateRes = await request(app)
      .patch(`/api/issues/${issueId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ status: "IN_PROGRESS" });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.issue.status).toBe("IN_PROGRESS");
  });

  it("a member cannot edit an issue they didn't create and aren't assigned to", async () => {
    const { owner, member, projectId } = await setupProjectWithRoles();

    // The owner creates and self-assigns an issue.
    const createRes = await request(app)
      .post(`/api/projects/${projectId}/issues`)
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Owner's issue" });
    const issueId = createRes.body.data.issue.id;

    // The plain member tries to edit it -- should be forbidden.
    const updateRes = await request(app)
      .patch(`/api/issues/${issueId}`)
      .set("Authorization", `Bearer ${member.token}`)
      .send({ status: "DONE" });

    expect(updateRes.status).toBe(403);
  });

  it("only the OWNER can change a member's role, not an ADMIN", async () => {
    const { admin, member, projectId } = await setupProjectWithRoles();

    const res = await request(app)
      .patch(`/api/projects/${projectId}/members/${member.userId}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ role: "ADMIN" });

    expect(res.status).toBe(403);
  });
});
