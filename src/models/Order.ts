import mongoose, { type InferSchemaType, type Model } from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    titleSnapshot: { type: String, required: true, trim: true },
    unitPriceSnapshot: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMode: {
      type: String,
      enum: ["ONLINE", "COD"],
      default: "ONLINE"
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING"
    },
    status: { type: String, required: true, enum: ["CONFIRMED", "REJECTED", "CANCELLED", "OUT_FOR_DELIVERY", "DELIVERED", "ACCEPTED", "RETURNED"] as const, default: "CONFIRMED" },
    returnableUntil: { type: Date, default: null },
    shippingAddress: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      zip: { type: String, required: true, trim: true },
      country: { type: String, required: true, trim: true },
    },
    isPayout: { type: Boolean, default: false },
    idempotencyKey: { type: String, default: null, trim: true },
  },
  { timestamps: true },
);

OrderSchema.index({ buyerId: 1, createdAt: -1 });
OrderSchema.index({ sellerId: 1, createdAt: -1 });
OrderSchema.index(
  { buyerId: 1, productId: 1, idempotencyKey: 1 },
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

