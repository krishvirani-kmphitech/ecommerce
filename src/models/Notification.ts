import mongoose, { type InferSchemaType, type Model } from "mongoose";

const NotificationSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        title: { type: String, required: true, trim: true },
        message: { type: String, required: true, trim: true },
    },
    { timestamps: true },
);

NotificationSchema.index({ userId: 1 });

export type NotificationDoc = InferSchemaType<typeof NotificationSchema> & {
    _id: mongoose.Types.ObjectId;
};

export type NotificationModel = Model<NotificationDoc>;

export const Notification = (mongoose.models.Notification as NotificationModel | undefined) ?? mongoose.model<NotificationDoc>("Notification", NotificationSchema);
