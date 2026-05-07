import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import { messages } from "../constants/messages.js";
import * as notificationServices from "../services/notificationService.js"
import { logger } from "../utils/logger.js";

export async function getNotification(req: Request, res: Response) {

    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();
   
    const result = await notificationServices.getNotification({ userId });
    logger.debug(result);
    sendSuccess(res, { statusCode: 200, message: messages.NOTIFICATION.GET_SUCCESS, data: result });

}