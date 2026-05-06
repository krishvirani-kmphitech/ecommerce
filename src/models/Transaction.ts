import mongoose, { type InferSchemaType, type Model } from "mongoose";

const TransactionSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        type: { type: String, enum: ["pay", "refund", "payout"], required: true },
        amount: { type: Number, required: true }
    },
    { timestamps: true },
);

export type TransactionDoc = InferSchemaType<typeof TransactionSchema> & {
    _id: mongoose.Types.ObjectId;
};

export type TransactionModel = Model<TransactionDoc>;

export const Transaction =
    (mongoose.models.Transaction as TransactionModel | undefined) ?? mongoose.model<TransactionDoc>("Transaction", TransactionSchema);

