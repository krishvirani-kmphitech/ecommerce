import mongoose, { type InferSchemaType, type Model } from "mongoose";

const ReturnSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    reason: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ["PENDING", "APPROVED", "REJECTED", "REFUNDED"] as const, default: "PENDING" },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true },
);

ReturnSchema.index({ orderId: 1, buyerId: 1 });
ReturnSchema.index({ status: 1, createdAt: -1 });

export type ReturnDoc = InferSchemaType<typeof ReturnSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ReturnModel = Model<ReturnDoc>;

export const Return = (mongoose.models.Return as ReturnModel | undefined) ?? mongoose.model<ReturnDoc>("Return", ReturnSchema);
