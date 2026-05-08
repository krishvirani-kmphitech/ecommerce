import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Notification } from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";
import { signAccessToken } from "../utils/jwt.js";
import type { UserRole } from "../types/auth.js";
import { messages } from "../constants/messages.js";

export type PublicUser = {
  id: string;
  email: string;
  role: UserRole;
};

function toPublicUser(user: { _id: unknown; email: string; role: UserRole }): PublicUser {
  return { id: String(user._id), email: user.email, role: user.role };
}

type MongoErrorWithCode = Error & { code?: number };

function isMongoDuplicateError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error as MongoErrorWithCode).code === 11000
  );
}

export async function register(params: { email: string; password: string; role: UserRole }): Promise<{
  accessToken: string;
  user: PublicUser;
}> {
  const email = params.email.toLowerCase();
  const existing = await User.findOne({ email, deletedAt: null }).lean().exec();
  if (existing) throw ApiError.conflict(messages.AUTH.EMAIL_EXISTS);

  const passwordHash = await bcrypt.hash(params.password, 12);
  try {

    const user = await User.create({ email, passwordHash, role: params.role, deletedAt: null });
    await Notification.create({
      userId: user._id,
      title: "Welcome to our E-commerce Platform!",
      message: "Thank you for registering. We're excited to have you on board!",
    });

    const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
    return { accessToken, user: toPublicUser(user) };

  } catch (error) {

    if (isMongoDuplicateError(error)) {
      throw ApiError.conflict(messages.AUTH.EMAIL_EXISTS);
    }
    throw error;

  }

}

export async function login(params: { email: string; password: string }): Promise<{
  accessToken: string;
  user: PublicUser;
}> {
  const email = params.email.toLowerCase();
  const user = await User.findOne({ email, deletedAt: null }).select("+passwordHash").exec();
  if (!user) throw ApiError.unauthorized(messages.AUTH.INVALID_CREDENTIALS);

  const ok = await user.verifyPassword(params.password);
  if (!ok) throw ApiError.unauthorized(messages.AUTH.INVALID_CREDENTIALS);

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  return { accessToken, user: toPublicUser(user) };
}

export async function me(params: { userId: string }): Promise<{ user: PublicUser }> {
  const user = await User.findOne({ _id: params.userId, deletedAt: null }).lean().exec();
  if (!user) throw ApiError.unauthorized();
  return { user: toPublicUser(user as { _id: unknown; email: string; role: UserRole }) };
}

export async function deleteUser(params: { userId: string }): Promise<{ user: PublicUser }> {

  const user = await User.findOneAndUpdate(
    { _id: params.userId, deletedAt: null },
    { deletedAt: new Date() },
    { new: true }
  )
    .lean().exec();

  if (!user) throw ApiError.unauthorized();

  return { user: toPublicUser(user as { _id: unknown; email: string; role: UserRole }) };
}