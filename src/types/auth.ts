export type UserRole = "buyer" | "seller" | "admin";

export type AuthUser = {
  id: string;
  role: UserRole;
};

