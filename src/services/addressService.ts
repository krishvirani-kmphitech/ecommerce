import mongoose from "mongoose";
import { User } from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/Notification.js";
import { messages } from "../constants/messages.js";

export type PublicAddress = {
    id: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isPrimary: boolean;
    createdAt: Date;
    updatedAt: Date;
};

type AddressDocument = {
    _id: mongoose.Types.ObjectId;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    isPrimary?: boolean;
    createdAt: Date;
    updatedAt: Date;
};

function ensureObjectId(id: string, message: string): mongoose.Types.ObjectId {
    if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest(message);
    return new mongoose.Types.ObjectId(id);
}

function toPublicAddress(address: AddressDocument): PublicAddress {
    return {
        id: String(address._id),
        street: address.street,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
        isPrimary: address.isPrimary || false,
        createdAt: address.createdAt,
        updatedAt: address.updatedAt,
    };
}

export async function addAddress(params: {
    userId: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
}): Promise<PublicAddress> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const user = await User.findById(userId).exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    // If this is the first address, make it primary
    const isPrimary = !user.addresses || user.addresses.length === 0;

    const address = {
        street: params.street,
        city: params.city,
        state: params.state,
        zip: params.zip,
        country: params.country,
        isPrimary,
    };

    user.addresses.push(address as AddressDocument);
    await user.save();

    await Notification.create({
        userId,
        title: "New Address Added",
        message: `Your new address at ${params.street}, ${params.city} has been added successfully.`
    });

    return toPublicAddress(user.addresses[user.addresses.length - 1] as AddressDocument);
}

export async function getAddresses(params: { userId: string }): Promise<PublicAddress[]> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const user = await User.findById(userId).lean().exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    return (user.addresses || []).map(toPublicAddress);
}

export async function setPrimaryAddress(params: {
    userId: string;
    addressId: string;
}): Promise<PublicAddress[]> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);
    const addressId = ensureObjectId(params.addressId, messages.COMMON.INVALID_ADDRESS);

    const user = await User.findById(userId).exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    const addressIndex = (user.addresses || []).findIndex(
        (a) => String(a._id) === String(addressId),
    );
    if (addressIndex === -1) {
        throw ApiError.notFound(messages.COMMON.ADDRESS_NOT_FOUND);
    }

    // Set all addresses to not primary
    user.addresses.forEach((a) => {
        a.isPrimary = false;
    });

    // Set the selected address to primary
    user.addresses[addressIndex]!.isPrimary = true;
    await user.save();

    await Notification.create({
        userId,
        title: "Primary Address Updated",
        message: `Your primary address has been updated to ${user.addresses[addressIndex]!.street}, ${user.addresses[addressIndex]!.city}.`
    });

    return user.addresses.map(toPublicAddress);
}

export async function deleteAddress(params: {
    userId: string;
    addressId: string;
}): Promise<PublicAddress[]> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);
    const addressId = ensureObjectId(params.addressId, messages.COMMON.INVALID_ADDRESS);

    const user = await User.findById(userId).exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    const addressIndex = (user.addresses || []).findIndex(
        (a) => String(a._id) === String(addressId),
    );
    if (addressIndex === -1) {
        throw ApiError.notFound(messages.COMMON.ADDRESS_NOT_FOUND);
    }

    const wasRemoved = user.addresses.splice(addressIndex, 1);
    const wasRemovalPrimary = wasRemoved[0]?.isPrimary;

    // If we removed the primary address and there are other addresses, make first one primary
    if (wasRemovalPrimary && user.addresses.length > 0) {
        user.addresses[0]!.isPrimary = true;
    }

    await user.save();

    return user.addresses.map(toPublicAddress);
}

export async function getPrimaryAddress(params: {
    userId: string;
}): Promise<PublicAddress | null> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const user = await User.findById(userId).lean().exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    const primary = (user.addresses || []).find((a) => a.isPrimary);
    return primary ? toPublicAddress(primary) : null;
}
