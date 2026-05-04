import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

describe("auth", () => {
  it("registers, logs in, and returns /auth/me", async () => {
    const app = createApp();

    const reg = await request(app).post("/auth/register").send({
      email: "buyer@example.com",
      password: "Password123!",
      role: "buyer",
    });

    expect(reg.status).toBe(201);
    expect(reg.body).toMatchObject({
      success: true,
      data: {
        accessToken: expect.any(String),
        user: { email: "buyer@example.com", role: "buyer", id: expect.any(String) },
      },
    });

    const login = await request(app).post("/auth/login").send({
      email: "buyer@example.com",
      password: "Password123!",
    });

    expect(login.status).toBe(200);
    expect(login.body.data.accessToken).toEqual(expect.any(String));

    const token = login.body.data.accessToken as string;

    const me = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body).toMatchObject({
      success: true,
      data: { user: { email: "buyer@example.com", role: "buyer", id: expect.any(String) } },
    });
  });

  it("rejects /auth/me without auth", async () => {
    const app = createApp();
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ success: false });
  });
});

