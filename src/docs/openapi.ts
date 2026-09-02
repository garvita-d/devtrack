// Hand-written OpenAPI 3.0 document describing every DevTrack endpoint.
// Served as interactive docs at /api-docs (see app.ts) and as raw JSON at
// /api-docs.json. Kept as a plain TS object (not YAML) so it needs no
// extra parsing dependency and gets basic editor support.

const errorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Resource not found" },
  },
};

const validationErrorResponse = {
  type: "object",
  properties: {
    success: { type: "boolean", example: false },
    message: { type: "string", example: "Validation failed" },
    errors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          field: { type: "string", example: "email" },
          message: { type: "string", example: "Invalid email address" },
        },
      },
    },
  },
};

const responses = {
  Unauthorized: {
    description: "Missing or invalid authentication token",
    content: { "application/json": { schema: errorResponse } },
  },
  Forbidden: {
    description: "Authenticated, but not allowed to perform this action",
    content: { "application/json": { schema: errorResponse } },
  },
  NotFound: {
    description: "Resource not found",
    content: { "application/json": { schema: errorResponse } },
  },
  Conflict: {
    description: "Conflicts with existing data (e.g. duplicate email)",
    content: { "application/json": { schema: errorResponse } },
  },
  ValidationError: {
    description: "Request body/query failed validation",
    content: { "application/json": { schema: validationErrorResponse } },
  },
};

const bearerAuth = [{ bearerAuth: [] as string[] }];

export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "DevTrack API",
    version: "1.0.0",
    description:
      "Project & issue management API — projects, role-based access control " +
      "(OWNER/ADMIN/MEMBER), issues, comments, and analytics.",
  },
  servers: [{ url: "/api", description: "API base path" }],
  tags: [
    { name: "Auth" },
    { name: "Projects" },
    { name: "Members" },
    { name: "Issues" },
    { name: "Comments" },
    { name: "Analytics" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: 'Paste the token from /auth/login or /auth/register, e.g. "eyJhbGciOi..."',
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "Garvita" },
          email: { type: "string", format: "email", example: "garvita@example.com" },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Project: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", example: "My First Project" },
          description: { type: "string", nullable: true },
          ownerId: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      ProjectMember: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          role: { type: "string", enum: ["OWNER", "ADMIN", "MEMBER"] },
          joinedAt: { type: "string", format: "date-time" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      Issue: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          projectId: { type: "string", format: "uuid" },
          createdBy: { type: "string", format: "uuid" },
          assignedTo: { type: "string", format: "uuid", nullable: true },
          title: { type: "string", example: "Set up CI pipeline" },
          description: { type: "string", nullable: true },
          status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
          priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
          dueDate: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Comment: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          issueId: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid" },
          content: { type: "string", example: "Started working on this." },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Analytics: {
        type: "object",
        properties: {
          totalIssues: { type: "integer", example: 12 },
          todo: { type: "integer", example: 4 },
          inProgress: { type: "integer", example: 3 },
          completed: { type: "integer", example: 5 },
          highPriority: { type: "integer", example: 2 },
          byPriority: {
            type: "object",
            properties: {
              low: { type: "integer" },
              medium: { type: "integer" },
              high: { type: "integer" },
              critical: { type: "integer" },
            },
          },
          unassignedIssues: { type: "integer", example: 6 },
        },
      },
    },
  },
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new account",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", minLength: 2, example: "Garvita" },
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8, example: "password123" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Account created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "409": responses.Conflict,
          "400": responses.ValidationError,
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Log in with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Logged in",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        user: { $ref: "#/components/schemas/User" },
                        token: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": responses.Unauthorized,
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Log out (stateless — client discards the token)",
        security: bearerAuth,
        responses: { "200": { description: "Logged out" }, "401": responses.Unauthorized },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get the current authenticated user",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object", properties: { user: { $ref: "#/components/schemas/User" } } },
                  },
                },
              },
            },
          },
          "401": responses.Unauthorized,
        },
      },
    },
    "/projects": {
      post: {
        tags: ["Projects"],
        summary: "Create a project (you become its OWNER)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name"],
                properties: {
                  name: { type: "string", minLength: 2, maxLength: 120 },
                  description: { type: "string", maxLength: 2000 },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Project created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: { type: "object", properties: { project: { $ref: "#/components/schemas/Project" } } },
                  },
                },
              },
            },
          },
          "401": responses.Unauthorized,
          "400": responses.ValidationError,
        },
      },
      get: {
        tags: ["Projects"],
        summary: "List projects you're a member of",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Your projects",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean", example: true },
                    data: {
                      type: "object",
                      properties: {
                        projects: { type: "array", items: { $ref: "#/components/schemas/Project" } },
                      },
                    },
                  },
                },
              },
            },
          },
          "401": responses.Unauthorized,
        },
      },
    },
    "/projects/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Projects"],
        summary: "Get a project by id (must be a member)",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Project details",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { success: { type: "boolean" }, data: { type: "object", properties: { project: { $ref: "#/components/schemas/Project" } } } },
                },
              },
            },
          },
          "403": responses.Forbidden,
          "404": responses.NotFound,
        },
      },
      patch: {
        tags: ["Projects"],
        summary: "Update a project (OWNER or ADMIN only)",
        security: bearerAuth,
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Project updated" },
          "403": responses.Forbidden,
          "404": responses.NotFound,
        },
      },
      delete: {
        tags: ["Projects"],
        summary: "Delete a project (OWNER only)",
        security: bearerAuth,
        responses: {
          "200": { description: "Project deleted" },
          "403": responses.Forbidden,
          "404": responses.NotFound,
        },
      },
    },
    "/projects/{id}/analytics": {
      get: {
        tags: ["Analytics"],
        summary: "Issue counts by status and priority for a project",
        security: bearerAuth,
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": {
            description: "Analytics for the project",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object", properties: { analytics: { $ref: "#/components/schemas/Analytics" } } },
                  },
                },
              },
            },
          },
          "403": responses.Forbidden,
        },
      },
    },
    "/projects/{id}/members": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Members"],
        summary: "List a project's members",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Members",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: { type: "object", properties: { members: { type: "array", items: { $ref: "#/components/schemas/ProjectMember" } } } },
                  },
                },
              },
            },
          },
          "403": responses.Forbidden,
        },
      },
      post: {
        tags: ["Members"],
        summary: "Add a member to the project (OWNER or ADMIN only)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["userId"],
                properties: {
                  userId: { type: "string", format: "uuid" },
                  role: { type: "string", enum: ["ADMIN", "MEMBER"], default: "MEMBER" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Member added" },
          "403": responses.Forbidden,
          "404": responses.NotFound,
          "409": responses.Conflict,
        },
      },
    },
    "/projects/{id}/members/{userId}": {
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
        { name: "userId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      ],
      patch: {
        tags: ["Members"],
        summary: "Change a member's role (OWNER only)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["role"], properties: { role: { type: "string", enum: ["ADMIN", "MEMBER"] } } },
            },
          },
        },
        responses: { "200": { description: "Role updated" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
      delete: {
        tags: ["Members"],
        summary: "Remove a member (OWNER or ADMIN only)",
        security: bearerAuth,
        responses: { "200": { description: "Member removed" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
    },
    "/projects/{projectId}/issues": {
      parameters: [{ name: "projectId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      post: {
        tags: ["Issues"],
        summary: "Create an issue in a project (any member)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string", minLength: 2, maxLength: 200 },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"], default: "MEDIUM" },
                  status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"], default: "TODO" },
                  assignedTo: { type: "string", format: "uuid" },
                  dueDate: { type: "string", format: "date-time" },
                },
              },
            },
          },
        },
        responses: {
          "201": {
            description: "Issue created",
            content: {
              "application/json": {
                schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { issue: { $ref: "#/components/schemas/Issue" } } } } },
              },
            },
          },
          "403": responses.Forbidden,
          "400": responses.ValidationError,
        },
      },
      get: {
        tags: ["Issues"],
        summary: "List issues in a project, with filtering/search/pagination",
        security: bearerAuth,
        parameters: [
          { name: "status", in: "query", schema: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] } },
          { name: "priority", in: "query", schema: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] } },
          { name: "assignedTo", in: "query", schema: { type: "string", format: "uuid" } },
          { name: "search", in: "query", schema: { type: "string" }, description: "Matches title or description" },
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: {
          "200": {
            description: "Filtered, paginated issues",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    success: { type: "boolean" },
                    data: {
                      type: "object",
                      properties: {
                        issues: { type: "array", items: { $ref: "#/components/schemas/Issue" } },
                        pagination: {
                          type: "object",
                          properties: {
                            page: { type: "integer" },
                            limit: { type: "integer" },
                            total: { type: "integer" },
                            totalPages: { type: "integer" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "403": responses.Forbidden,
        },
      },
    },
    "/issues/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Issues"],
        summary: "Get an issue by id (must be a project member)",
        security: bearerAuth,
        responses: { "200": { description: "Issue details" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
      patch: {
        tags: ["Issues"],
        summary: "Update an issue (OWNER/ADMIN, or the creator/assignee)",
        security: bearerAuth,
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string", enum: ["TODO", "IN_PROGRESS", "DONE"] },
                  priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                  assignedTo: { type: "string", format: "uuid", nullable: true },
                  dueDate: { type: "string", format: "date-time", nullable: true },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Issue updated" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
      delete: {
        tags: ["Issues"],
        summary: "Delete an issue (OWNER/ADMIN, or the creator/assignee)",
        security: bearerAuth,
        responses: { "200": { description: "Issue deleted" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
    },
    "/issues/{issueId}/comments": {
      parameters: [{ name: "issueId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      get: {
        tags: ["Comments"],
        summary: "List comments on an issue",
        security: bearerAuth,
        responses: {
          "200": {
            description: "Comments",
            content: {
              "application/json": {
                schema: { type: "object", properties: { success: { type: "boolean" }, data: { type: "object", properties: { comments: { type: "array", items: { $ref: "#/components/schemas/Comment" } } } } } },
              },
            },
          },
          "403": responses.Forbidden,
        },
      },
      post: {
        tags: ["Comments"],
        summary: "Add a comment to an issue (any project member)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["content"], properties: { content: { type: "string", minLength: 1, maxLength: 3000 } } },
            },
          },
        },
        responses: { "201": { description: "Comment created" }, "403": responses.Forbidden, "400": responses.ValidationError },
      },
    },
    "/comments/{id}": {
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
      patch: {
        tags: ["Comments"],
        summary: "Edit a comment (author only)",
        security: bearerAuth,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { type: "object", required: ["content"], properties: { content: { type: "string", minLength: 1, maxLength: 3000 } } },
            },
          },
        },
        responses: { "200": { description: "Comment updated" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
      delete: {
        tags: ["Comments"],
        summary: "Delete a comment (author, or project OWNER/ADMIN)",
        security: bearerAuth,
        responses: { "200": { description: "Comment deleted" }, "403": responses.Forbidden, "404": responses.NotFound },
      },
    },
  },
};
