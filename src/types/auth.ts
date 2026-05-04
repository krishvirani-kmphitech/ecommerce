export type UserRole = "buyer" | "seller";

export type AuthUser = {
  id: string;
  role: UserRole;
};

