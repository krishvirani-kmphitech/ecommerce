import mongoose, { type HydratedDocument, type InferSchemaType, type Model } from "mongoose";

const CartItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const CartSchema = new mongoose.Schema(
  {
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: { type: [CartItemSchema], default: [] },
  },
  { timestamps: true },
);

CartSchema.index({ buyerId: 1 }, { unique: true });
CartSchema.index({ buyerId: 1, "items.productId": 1 });

export type CartItem = InferSchemaType<typeof CartItemSchema>;

export type CartSchemaType = InferSchemaType<typeof CartSchema>;

export type CartDoc = HydratedDocument<CartSchemaType>;

export type CartModel = Model<CartSchemaType>;

export const Cart =
  (mongoose.models.Cart as CartModel | undefined) ?? mongoose.model<CartSchemaType>("Cart", CartSchema);

