
import paymentService from "../services/payment.service.js";
import stripe from "../config/stripe.js";

class PaymentController {
    async create(req, res, next) {
        try {
            const rideId = req.body.rideId || process.env.DEFAULT_RIDE_ID;

            if (!rideId) {
                const error = new Error(
                    "DEFAULT_RIDE_ID is not configured"
                );
                error.statusCode = 500;
                throw error;
            }

            const result = await paymentService.createPayment(rideId);

            return res.status(result.created ? 201 : 200).json({
                message: result.created
                    ? "Payment created successfully"
                    : "Payment already exists for this ride",
                payment: {
                    id: result.payment.id,
                    rideId: result.payment.rideId,
                    amount: result.payment.amount.toString(),
                    status: result.payment.status,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    async createAttempt(req, res, next) {
        try {
            const { paymentId } = req.params;
            const { idempotencyKey } = req.body;

            const result = await paymentService.createCheckoutAttempt(
                paymentId,
                idempotencyKey
            );

            return res.status(result.created ? 201 : 200).json({
                message: result.created
                    ? "Payment attempt created"
                    : "Existing payment attempt reused",
                paymentAttempt: {
                    id: result.attempt.id,
                    paymentId: result.attempt.paymentId,
                    provider: result.attempt.provider,
                    status: result.attempt.status,
                    providerOrderId: result.attempt.providerOrderId,
                },
                checkoutUrl: result.checkoutUrl,
            });
        } catch (error) {
            next(error);
        }
    }

    async handle(req, res) {

        let event;

        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                req.headers["stripe-signature"],
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (error) {
            return res.status(400).send(`Webhook Error: ${error.message}`);
        }

        try {
            if (event.type === "checkout.session.completed") {
                await paymentService.handleCheckoutSessionCompleted(event);
            }

            return res.status(200).json({ received: true });
        } catch (error) {
            console.error("Stripe webhook processing failed:", error);
            return res.status(500).json({
                message: "Webhook processing failed",
            });
        }
    }
}

export default new PaymentController();
