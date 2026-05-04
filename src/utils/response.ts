import type { Response } from "express";

/**
 * API response envelope:
 * - Success: `{ success: true, message: string, data?: T }`
 * - Error: `{ success: false, message: string, code?: string, details?: unknown }`
 *
 * Auth: `Authorization: Bearer <accessToken>`
 */
export type SuccessResponse<TData> = {
  success: true;
  message: string;
  data?: TData;
};

export function sendSuccess<TData>(res: Response, options: { statusCode?: number; message: string; data?: TData }): void {
  res.status(options.statusCode ?? 200).json({
    success: true,
    message: options.message,
    ...(options.data === undefined ? {} : { data: options.data }),
  } satisfies SuccessResponse<TData>);
}

