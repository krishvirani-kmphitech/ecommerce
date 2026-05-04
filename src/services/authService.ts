import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
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

export async function register(params: { email: string; password: string; role: UserRole }): Promise<{
  accessToken: string;
  user: PublicUser;
}> {
  const email = params.email.toLowerCase();
  const existing = await User.findOne({ email }).lean().exec();
  if (existing) throw ApiError.conflict(messages.AUTH.EMAIL_EXISTS);

  const passwordHash = await bcrypt.hash(params.password, 12);
  const user = await User.create({ email, passwordHash, role: params.role });

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  return { accessToken, user: toPublicUser(user) };
}

export async function login(params: { email: string; password: string }): Promise<{
  accessToken: string;
  user: PublicUser;
}> {
  const email = params.email.toLowerCase();
  const user = await User.findOne({ email }).select("+passwordHash").exec();
  if (!user) throw ApiError.unauthorized(messages.AUTH.INVALID_CREDENTIALS);

  const ok = await user.verifyPassword(params.password);
  if (!ok) throw ApiError.unauthorized(messages.AUTH.INVALID_CREDENTIALS);

  const accessToken = signAccessToken({ id: user._id.toString(), role: user.role });
  return { accessToken, user: toPublicUser(user) };
}

export async function me(params: { userId: string }): Promise<{ user: PublicUser }> {
  const user = await User.findById(params.userId).lean().exec();
  if (!user) throw ApiError.unauthorized();
  return { user: toPublicUser(user as { _id: unknown; email: string; role: UserRole }) };
}

