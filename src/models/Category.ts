import mongoose, { type InferSchemaType, type Model } from "mongoose";

const CategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true },
    deletedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true },
);

CategorySchema.index({ name: 1 }, {
  unique: true,
  partialFilterExpression: {
    deletedAt: null
  }
});

export type CategoryDoc = InferSchemaType<typeof CategorySchema> & {
  _id: mongoose.Types.ObjectId;
};

export type CategoryModel = Model<CategoryDoc>;

export const Category =
  (mongoose.models.Category as CategoryModel | undefined) ?? mongoose.model<CategoryDoc>("Category", CategorySchema);
