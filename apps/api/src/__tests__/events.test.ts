import { describe, it, expect, afterAll } from "vitest";
import { buildApp } from "../server.js";

describe("GET /events", () => {
  const app = buildApp();

  afterAll(async () => {
    await app.close();
  });

  it("returns 400 when lat/lon are missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events",
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 400 when lon is missing", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events?lat=54.12",
    });
    expect(response.statusCode).toBe(400);
  });

  it("returns 200 with array when lat and lon are given", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events?lat=54.12&lon=8.85",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns 200 when category filter is given", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events?lat=54.12&lon=8.85&category=gottesdienst",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns 200 when dateFrom filter is given", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events?lat=54.12&lon=8.85&dateFrom=2026-01-01",
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(Array.isArray(body)).toBe(true);
  });

  it("returns 400 when radius exceeds max (100000)", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/events?lat=54.12&lon=8.85&radius=999999",
    });
    expect(response.statusCode).toBe(400);
  });
});
