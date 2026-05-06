import cron from "node-cron";
import { Order } from "../models/Order.js";
import { Transaction } from "../models/Transaction.js";
import { logger } from "../utils/logger.js";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { config } from "../constants/config.js";
import { Notification } from "../models/Notification.js";

export function startOrderStatusCron(): void {
    // Run every minute to check for orders that need status update
    cron.schedule(config.CRON_TIME_START_ORDER_STATUS, async () => {
        try {
            logger.debug("Running order status cron job");

            const orderOutForDeliveryDate = new Date(Date.now() - config.DELIVERY_TIME);

            // Find orders with DELIVERED status that were delivered more than 1 hour ago
            const ordersToUpdateDelivered = await Order.find({
                status: "OUT_FOR_DELIVERY",
                updatedAt: { $lte: orderOutForDeliveryDate },
            })
                .exec();

            for (const order of ordersToUpdateDelivered) {
                // Update order status to ACCEPT
                order.status = "DELIVERED";
                await order.save();

                await Notification.create({
                    userId: order.sellerId,
                    title: "Order Delivered",
                    message: `Your order for ${order.titleSnapshot} has been delivered.`
                });

                await Notification.create({
                    userId: order.buyerId,
                    title: "Order Delivered",
                    message: `Your order for ${order.titleSnapshot} has been delivered. Please confirm receipt or request a return if there are any issues.`
                });

                logger.info(
                    { orderId: String(order._id), sellerId: String(order.sellerId) },
                    "Order status updated to DELIVERED"
                );
            }

            const orderReturnDate = new Date(Date.now() - config.ORDER_RETURNABLE_TIME);

            // Find orders with DELIVERED status that were delivered more than 1 hour ago
            const ordersToUpdateAccept = await Order.find({
                status: "DELIVERED",
                updatedAt: { $lte: orderReturnDate },
            })
                .exec();

            for (const order of ordersToUpdateAccept) {
                // Update order status to ACCEPT
                order.status = "ACCEPTED";
                await order.save();

                await Notification.create({
                    userId: order.sellerId,
                    title: "Order Accepted",
                    message: `Your order for ${order.titleSnapshot} has been accepted by the buyer.`
                });

                logger.info(
                    { orderId: String(order._id) },
                    "Order status updated to ACCEPTED"
                );
            }

        } catch (error) {
            logger.error({ error }, "Error in order status cron job");
        }
    });

    logger.info("Order status cron job started");

}

export async function makePayementToSeller(): Promise<void> {
    // run every day at 10 AM
    cron.schedule(config.CRON_TIME_MAKE_PAYMENT, async () => {

        logger.debug("Running seller payment cron job");

        const session = await mongoose.startSession();

        try {
            await session.withTransaction(async () => {

                const sellers = await User
                    .find({ role: "seller" })
                    .session(session)
                    .lean()
                    .exec();

                for (const seller of sellers) {
                    const orders = await Order
                        .find({ sellerId: seller._id, status: "ACCEPTED", isPayout: false })
                        .session(session)
                        .exec();

                    for (const order of orders) {
                        order.isPayout = true;
                        await order.save({ session });
                    }

                    const totalAmount = orders.reduce((sum, order) => sum + order.totalAmount, 0);
                    try {
                        if (totalAmount > 0) {
                            const transaction = await Transaction.create(
                                [{
                                    sellerId: seller._id,
                                    type: "payout",
                                    amount: totalAmount
                                }],
                                { session });

                            await Notification.create(
                                [{
                                    userId: seller._id,
                                    title: "Payout Processed",
                                    message: `A payout of ${totalAmount.toFixed(2)} has been processed to your account for your recent sales.`
                                }],
                                { session });

                            logger.debug(transaction);
                        }
                    } catch (error) {
                        logger.error({ error }, "Error in payout transaction");
                    }

                    logger.info(
                        { sellerId: String(seller._id), totalAmount },
                        "Payout transaction created for seller"
                    );
                }

            });

        } finally {
            await session.endSession();
        }

    });

    logger.info("Seller payout cron job started");

}


// export function stopOrderStatusCron(taskId: string): void {
//     cron.getTasks().forEach((task) => {
//         if (task.taskId?.toString() === taskId) {
//             task.stop();
//             logger.info("Order status cron job stopped");
//         }
//     });
// }
