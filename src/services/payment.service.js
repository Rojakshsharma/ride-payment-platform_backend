
import { prisma } from "../config/database.js";
import stripe from "../config/stripe.js";

class PaymentService {
    static async createPayment(rideId) {
        const amount = process.env.DEFAULT_PAYMENT_AMOUNT;

        if (
            !amount ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
        ) {
            const error = new Error("Invalid DEFAULT_PAYMENT_AMOUNT");
            error.statusCode = 500;
            throw error;
        }

        // Return the existing Payment if one already exists for this ride.
        const existingPayment = await prisma.payment.findUnique({
            where: { rideId },
        });

        if (existingPayment) {
            return {
                payment: existingPayment,
                created: false,
            };
        }

        try {
            const payment = await prisma.payment.create({
                data: {
                    rideId,
                    amount,
                    status: "PENDING",
                },
            });

            return {
                payment,
                created: true,
            };
        } catch (error) {
            // Another request may have created the Payment concurrently.
            if (error.code === "P2002") {
                const payment = await prisma.payment.findUnique({
                    where: { rideId },
                });

                if (payment) {
                    return {
                        payment,
                        created: false,
                    };
                }
            }

            throw error;
        }
    }

    static async createCheckoutAttempt(paymentId, idempotencyKey) {
        return prisma.$transaction(async (tx) => {
            const payments = await tx.$queryRaw`
            SELECT * FROM "Payment"
            WHERE "id" = ${paymentId}
            FOR UPDATE
        `;

            const payment = payments[0];
            if (!payment) {
                throw new Error("Payment record not found");
            }

            if (payment.status === 'SUCCESS') {
                throw new Error("Payment has already been successfully processed");
            }

            const existingAttempt = await tx.paymentAttempt.findUnique({
                where: { idempotencyKey: idempotencyKey },
            });

            if (existingAttempt) {
                if (existingAttempt.paymentId !== paymentId) {
                    throw new Error(
                        "Idempotency key belongs to another payment"
                    );
                }

                try {
                    const stripeSession = await stripe.checkout.sessions.retrieve(
                        existingAttempt.providerOrderId
                    );

                    if (stripeSession.status === 'expired' || (stripeSession.status !== 'open' && stripeSession.payment_status === 'unpaid')) {
                        await tx.paymentAttempt.update({
                            where: { id: existingAttempt.id },
                            data: { status: 'FAILED' }
                        });
                        throw new Error("This payment session has expired. Please initiate a new attempt.");
                    }

                    return {
                        created: false,
                        attempt: existingAttempt,
                        checkoutUrl: stripeSession.url,
                    };
                } catch (stripeRetrieveError) {
                    throw stripeRetrieveError;
                }
            }

            const activeAttempts = await tx.paymentAttempt.findMany({
                where: {
                    paymentId: paymentId,
                    status: { in: ['CREATED', 'PENDING'] }
                }
            });

            if (activeAttempts.length > 0) {
                await tx.paymentAttempt.updateMany({
                    where: {
                        id: { in: activeAttempts.map(a => a.id) }
                    },
                    data: { status: 'FAILED' }
                });
            }

            if (activeAttempts.length > 0) {
                Promise.all(
                    activeAttempts.map(async (oldAttempt) => {
                        try {
                            await stripe.checkout.sessions.expire(oldAttempt.providerOrderId);
                        } catch (expireError) {
                            console.error(`Background expiry failed for ${oldAttempt.providerOrderId}:`, expireError);
                        }
                    })
                ).catch(err => console.error("Parallel expiry error:", err));
            }

            let session;
            try {
                session = await stripe.checkout.sessions.create(
                    {
                        // payment_method_types: ['card'],
                        line_items: [
                            {
                                price_data: {
                                    currency: 'usd',
                                    product_data: {
                                        name: `Ride Payment - ${payment.rideId}`,
                                    },
                                    unit_amount: Math.round(Number(payment.amount) * 100),
                                },
                                quantity: 1,
                            },
                        ],
                        mode: 'payment',
                        success_url: `${process.env.STRIPE_SUCCESS_URL}/payment/success?paymentId=${paymentId}`,
                        cancel_url: `${process.env.STRIPE_CANCEL_URL}/payment/cancel?paymentId=${paymentId}`,
                    },
                    {
                        idempotencyKey: idempotencyKey,
                    }
                );
            } catch (stripeError) {
                throw stripeError;
            }

            try {
                const newAttempt = await tx.paymentAttempt.create({
                    data: {
                        paymentId: paymentId,
                        provider: 'STRIPE',
                        status: 'CREATED',
                        idempotencyKey: idempotencyKey,
                        providerOrderId: session.id,
                    },
                });

                return {
                    created: true,
                    attempt: newAttempt,
                    checkoutUrl: session.url,
                };
            } catch (dbError) {
                if (dbError.code === 'P2002') {
                    const savedAttempt = await tx.paymentAttempt.findUnique({
                        where: { idempotencyKey: idempotencyKey },
                    });

                    return {
                        created: false,
                        attempt: savedAttempt,
                        checkoutUrl: session.url,
                    };
                }
                throw dbError;
            }
        });
    }

    static async handleCheckoutSessionCompleted(event) {
        const session = event.data.object;

        await prisma.$transaction(async (tx) => {
            const attempt = await tx.paymentAttempt.findFirst({
                where: {
                    provider: "STRIPE",
                    providerOrderId: session.id,
                },
                include: {
                    payment: true,
                },
            });

            if (!attempt) {
                throw new Error(`Payment attempt not found for session ${session.id}`);
            }

            // Prevent processing the same Stripe event twice.
            const existingEvent = await tx.paymentWebhookEvent.findUnique({
                where: {
                    provider_providerEventId: {
                        provider: "STRIPE",
                        providerEventId: event.id,
                    },
                },
            });

            if (existingEvent) {
                return;
            }

            await tx.paymentWebhookEvent.create({
                data: {
                    provider: "STRIPE",
                    providerEventId: event.id,
                    eventType: event.type,
                    paymentId: attempt.paymentId,
                    processedAt: new Date(),
                },
            });

            // Only mark successful when Stripe confirms the payment is paid.
            if (session.payment_status !== "paid") {
                return;
            }

            await tx.paymentAttempt.update({
                where: { id: attempt.id },
                data: { status: "SUCCESS" },
            });

            await tx.payment.update({
                where: { id: attempt.paymentId },
                data: { status: "SUCCESS" },
            });

            await tx.transaction.upsert({
                where: { paymentId: attempt.paymentId },
                create: {
                    paymentId: attempt.paymentId,
                    amount: attempt.payment.amount,
                    status: "SUCCESS",
                    provider: "STRIPE",
                },
                update: {
                    status: "SUCCESS",
                    provider: "STRIPE",
                },
            });
        });
    }




}

export default PaymentService;
