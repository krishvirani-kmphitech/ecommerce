import mongoose, { type InferSchemaType, type Model } from "mongoose";

const ReviewSchema = new mongoose.Schema(
    {
        buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String, default: "", trim: true },
    },
    { timestamps: true },
);

ReviewSchema.index({ productId: 1, buyerId: 1 }, { unique: true });

export type ReviewDoc = InferSchemaType<typeof ReviewSchema> & {
    _id: mongoose.Types.ObjectId;
};

export type ReviewModel = Model<ReviewDoc>;

export const Review = (mongoose.models.Review as ReviewModel | undefined) ?? mongoose.model<ReviewDoc>("Review", ReviewSchema);
