import mongoose, { type InferSchemaType, type Model } from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    deletedAt: { type: Date, default: null, index: true },
  },
  { timestamps: true },
);

ProductSchema.index({ sellerId: 1, deletedAt: 1 });
ProductSchema.index({ title: "text" });

export type ProductDoc = InferSchemaType<typeof ProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type ProductModel = Model<ProductDoc>;

export const Product =
  (mongoose.models.Product as ProductModel | undefined) ?? mongoose.model<ProductDoc>("Product", ProductSchema);

