import type { AuthUser } from "./auth.js";

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
    /** Set by `validateQuery` — Express 5 makes `req.query` read-only, so validated values live here */
    validatedQuery?: unknown;
  }
}

