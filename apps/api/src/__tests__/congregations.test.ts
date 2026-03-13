import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../server.js";

describe("GET /congregations/:id", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when id is not a valid UUID", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/congregations/not-a-uuid",
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 404 when congregation does not exist", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/congregations/00000000-0000-0000-0000-000000000000",
    });
    expect(response.statusCode).toBe(404);
  });

  it("returns 400 for malformed id with special characters", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/congregations/invalid!id",
    });
    expect(response.statusCode).toBe(400);
  });
});
