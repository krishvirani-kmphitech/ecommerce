import bcrypt from "bcryptjs";
import mongoose, { type InferSchemaType, type Model } from "mongoose";
import type { UserRole } from "../types/auth.js";

const AddressSchema = new mongoose.Schema(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: true, timestamps: true },
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, required: true, enum: ["buyer", "seller", "admin"] satisfies UserRole[] },
    addresses: [AddressSchema],
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true },
);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: { $eq: null },
    },
  }
);

UserSchema.methods.verifyPassword = async function verifyPassword(password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash as string);
};

export type UserDoc = InferSchemaType<typeof UserSchema> & {
  _id: mongoose.Types.ObjectId;
  verifyPassword(password: string): Promise<boolean>;
};

export type UserModel = Model<UserDoc>;

export const User = (mongoose.models.User as UserModel | undefined) ?? mongoose.model<UserDoc>("User", UserSchema);

