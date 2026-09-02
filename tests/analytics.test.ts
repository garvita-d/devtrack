import request from "supertest";
import { afterAll, describe, expect, it } from "@jest/globals";
import {
  app,
  registerTestUser,
  cleanupTestData,
  disconnectPrisma,
} from "./helpers/testHelpers";

describe("Analytics", () => {
  const createdUserIds: string[] = [];
  const createdProjectIds: string[] = [];

  afterAll(async () => {
    await cleanupTestData({
      userIds: createdUserIds,
      projectIds: createdProjectIds,
    });
    await disconnectPrisma();
  });

  it("returns correct counts by status and priority", async () => {
    const user = await registerTestUser("analytics");
    createdUserIds.push(user.userId);

    const projectRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ name: "Analytics Test Project" });
    const projectId = projectRes.body.data.project.id;
    createdProjectIds.push(projectId);

    // 2 TODO (one LOW, one HIGH), 1 IN_PROGRESS (MEDIUM), 1 DONE (CRITICAL),
    // one of which is left unassigned.
    const issuesToCreate = [
      { title: "Todo low", status: "TODO", priority: "LOW" },
      { title: "Todo high", status: "TODO", priority: "HIGH" },
      {
        title: "In progress medium",
        status: "IN_PROGRESS",
        priority: "MEDIUM",
      },
      { title: "Done critical", status: "DONE", priority: "CRITICAL" },
    ];

    for (const issue of issuesToCreate) {
      await request(app)
        .post(`/api/projects/${projectId}/issues`)
        .set("Authorization", `Bearer ${user.token}`)
        .send(issue);
    }

    const res = await request(app)
      .get(`/api/projects/${projectId}/analytics`)
      .set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    const { analytics } = res.body.data;

    expect(analytics.totalIssues).toBe(4);
    expect(analytics.todo).toBe(2);
    expect(analytics.inProgress).toBe(1);
    expect(analytics.completed).toBe(1);
    expect(analytics.highPriority).toBe(2); // HIGH + CRITICAL
    expect(analytics.byPriority).toEqual({
      low: 1,
      medium: 1,
      high: 1,
      critical: 1,
    });
    expect(analytics.unassignedIssues).toBe(4); // none were assigned
  });

  it("rejects analytics requests from non-members", async () => {
    const owner = await registerTestUser("analytics-owner");
    const outsider = await registerTestUser("analytics-outsider");
    createdUserIds.push(owner.userId, outsider.userId);

    const projectRes = await request(app)
      .post("/api/projects")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ name: "Private Analytics Project" });
    createdProjectIds.push(projectRes.body.data.project.id);

    const res = await request(app)
      .get(`/api/projects/${projectRes.body.data.project.id}/analytics`)
      .set("Authorization", `Bearer ${outsider.token}`);

    expect(res.status).toBe(403);
  });
});
