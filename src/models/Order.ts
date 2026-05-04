import mongoose, { type InferSchemaType, type Model } from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    titleSnapshot: { type: String, required: true, trim: true },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [OrderItemSchema], required: true, default: [] },
    totalAmount: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ["CONFIRMED"] as const, default: "CONFIRMED" },
    idempotencyKey: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index(
  { buyerId: 1, sellerId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);

export type OrderDoc = InferSchemaType<typeof OrderSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type OrderModel = Model<OrderDoc>;

export const Order = (mongoose.models.Order as OrderModel | undefined) ?? mongoose.model<OrderDoc>("Order", OrderSchema);

