import bcrypt from "bcryptjs";
import mongoose, { type InferSchemaType, type Model } from "mongoose";
import type { UserRole } from "../types/auth.js";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["buyer", "seller"] satisfies UserRole[] },
  },
  { timestamps: true },
);

UserSchema.index({ email: 1 }, { unique: true });

UserSchema.methods.verifyPassword = async function verifyPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash as string);
};

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(password: string): Promise<boolean>;
};

export type UserModel = Model<UserDoc>;

export const User = (mongoose.models.User as UserModel | undefined) ?? mongoose.model<UserDoc>("User", UserSchema);

