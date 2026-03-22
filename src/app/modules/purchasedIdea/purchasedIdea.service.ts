import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {

    const existingPayment = await prisma.purchasedIdea.findFirst({
        where: {
            stripeEventId: event.id
        }
    });

    if (existingPayment) {
        console.log(`Event ${event.id} already processed. Skipping`);
        return { message: `Event ${event.id} already processed. Skipping` };
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;

            const ideaId = session.metadata?.ideaId;
            const userId = session.metadata?.userId;
            const transactionId = session.metadata?.transactionId;

            if (!ideaId || !userId || !transactionId) {
                console.error("Missing metadata in webhook event");
                return { message: "Missing metadata" };
            }

            await prisma.$transaction(async (tx) => {
                const status = session.payment_status === "paid"
                    ? PaymentStatus.PAID
                    : PaymentStatus.FAILED;

                await tx.purchasedIdea.update({
                    where: {
                        transactionId: transactionId
                    },
                    data: {
                        status: status,
                        paymentGatewayData: session,
                        stripeEventId: event.id
                    }
                });

                console.log(`PurchasedIdea updated for Transaction: ${transactionId}`);
            });

            break;
        }

        case "checkout.session.expired":
        case "payment_intent.payment_failed": {
            const session = event.data.object as any;
            const transactionId = session.metadata?.transactionId;

            if (transactionId) {
                await prisma.purchasedIdea.update({
                    where: { transactionId: transactionId },
                    data: { status: PaymentStatus.FAILED }
                });
                console.log(`Payment failed for Transaction: ${transactionId}`);
            }
            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    return { message: `Webhook Event ${event.id} processed successfully` };
};

export const PurchasedIdeaService = {
    handlerStripeWebhookEvent
};