import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

async function register(app: ReturnType<typeof createApp>, params: { email: string; password: string; role: "buyer" | "seller" }) {
  const res = await request(app).post("/auth/register").send(params);
  expect(res.status).toBe(201);
  return res.body.data as { accessToken: string; user: { id: string; email: string; role: string } };
}

describe("cart + checkout", () => {
  it("buyer can add item to cart and checkout decrements stock + clears cart", async () => {
    const app = createApp();

    const seller = await register(app, { email: "seller@example.com", password: "Password123!", role: "seller" });
    const buyer = await register(app, { email: "buyer2@example.com", password: "Password123!", role: "buyer" });

    const created = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${seller.accessToken}`)
      .send({ title: "Tee", category: "clothes", price: 199, quantity: 5 });

    expect(created.status).toBe(201);
    const productId = created.body.data.product.id as string;

    const add = await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${buyer.accessToken}`)
      .send({ productId, quantity: 2 });
    expect(add.status).toBe(200);
    expect(add.body.data.cart.items).toEqual([{ productId, quantity: 2 }]);

    const checkout = await request(app).post("/checkout").set("Authorization", `Bearer ${buyer.accessToken}`);
    expect(checkout.status).toBe(201);
    expect(checkout.body).toMatchObject({
      success: true,
      data: {
        orders: [
          {
            buyerId: buyer.user.id,
            sellerId: seller.user.id,
            status: "CONFIRMED",
            items: [{ productId, title: "Tee", unitPrice: 199, quantity: 2 }],
            totalAmount: 398,
          },
        ],
      },
    });

    const cartAfter = await request(app).get("/cart").set("Authorization", `Bearer ${buyer.accessToken}`);
    expect(cartAfter.status).toBe(200);
    expect(cartAfter.body.data.cart.items).toEqual([]);

    const productAfter = await request(app).get(`/products/${productId}`);
    expect(productAfter.status).toBe(200);
    expect(productAfter.body.data.product.quantity).toBe(3);
  });

  it("checkout is idempotent with Idempotency-Key", async () => {
    const app = createApp();

    const seller = await register(app, { email: "seller2@example.com", password: "Password123!", role: "seller" });
    const buyer = await register(app, { email: "buyer3@example.com", password: "Password123!", role: "buyer" });

    const created = await request(app)
      .post("/products")
      .set("Authorization", `Bearer ${seller.accessToken}`)
      .send({ title: "Mug", category: "home", price: 99, quantity: 10 });
    const productId = created.body.data.product.id as string;

    await request(app)
      .post("/cart/items")
      .set("Authorization", `Bearer ${buyer.accessToken}`)
      .send({ productId, quantity: 1 });

    const key = "k-123";
    const first = await request(app).post("/checkout").set("Authorization", `Bearer ${buyer.accessToken}`).set("Idempotency-Key", key);
    expect(first.status).toBe(201);
    const orderId = first.body.data.orders[0].id as string;

    const second = await request(app).post("/checkout").set("Authorization", `Bearer ${buyer.accessToken}`).set("Idempotency-Key", key);
    expect(second.status).toBe(201);
    expect(second.body.data.orders[0].id).toBe(orderId);
  });
});

