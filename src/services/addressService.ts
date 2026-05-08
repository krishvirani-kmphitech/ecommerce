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

    const address = {
        street: params.street,
        city: params.city,
        state: params.state,
        zip: params.zip,
        country: params.country
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

    user.primaryAddressId = addressId;
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
    const wasRemovalPrimary = user.primaryAddressId?.equals(wasRemoved[0]?._id);

    if (wasRemovalPrimary) {
        user.primaryAddressId = null;
    }

    await user.save();

    return user.addresses.map(toPublicAddress);
}

export async function getPrimaryAddress(params: { userId: string; }): Promise<PublicAddress> {
    const userId = ensureObjectId(params.userId, messages.COMMON.INVALID_USER);

    const user = await User.findById(userId).lean().exec();
    if (!user) throw ApiError.notFound(messages.COMMON.USER_NOT_FOUND);

    const primaryAddressId = user.primaryAddressId;

    if (!primaryAddressId) throw ApiError.notFound(messages.ADDRESS.PRIMARY_ADDRESS_NOT_SET);

    const primary = (user.addresses || []).find((a) => a._id.equals(primaryAddressId));

    if (!primary) throw ApiError.notFound(messages.ADDRESS.PRIMARY_ADDRESS_NOT_SET);

    return toPublicAddress(primary);
}
