import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import { sendSuccess } from "../utils/response.js";
import * as addressService from "../services/addressService.js";

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

    sendSuccess(res, { statusCode: 201, message: "Address added successfully", data: result });
}

export async function getAddresses(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.getAddresses({ userId });
    sendSuccess(res, { message: "Addresses fetched successfully", data: result });
}

export async function setPrimaryAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.setPrimaryAddress({
        userId,
        addressId: (req.body as { addressId: string }).addressId,
    });

    sendSuccess(res, { message: "Primary address updated successfully", data: result });
}

export async function deleteAddress(req: Request, res: Response): Promise<void> {
    const userId = req.user?.id;
    if (!userId) throw ApiError.unauthorized();

    const result = await addressService.deleteAddress({
        userId,
        addressId: (req.params as { id: string }).id,
    });

    sendSuccess(res, { message: "Address deleted successfully", data: result });
}
