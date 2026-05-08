import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as addressService from "../services/addressService.js";
import { messages } from "../constants/messages.js";

export async function addAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.addAddress({
        userId,
        street: (req.body as { street: string }).street,
        city: (req.body as { city: string }).city,
        state: (req.body as { state: string }).state,
        zip: (req.body as { zip: string }).zip,
        country: (req.body as { country: string }).country,
    });

    sendSuccess(res, { statusCode: 201, message: messages.ADDRESS.ADD_SUCCESS, data: result });
}

export async function getAddresses(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.getAddresses({ userId });
    sendSuccess(res, { message: messages.ADDRESS.FETCH_SUCCESS, data: result });
}

export async function setPrimaryAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.setPrimaryAddress({
        userId,
        addressId: (req.params as { id: string }).id,
    });

    sendSuccess(res, { message: messages.ADDRESS.PRIMARY_ADD_SUCCESS, data: result });
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.deleteAddress({
        userId,
        addressId: (req.params as { id: string }).id,
    });

    sendSuccess(res, { message: messages.ADDRESS.DELETED_SUCCESS, data: result });
}

export async function getPrimaryAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.getPrimaryAddress({
        userId
    });

    sendSuccess(res, { message: messages.ADDRESS.PRIMARY_FETCH_SUCCESS, data: result });
}