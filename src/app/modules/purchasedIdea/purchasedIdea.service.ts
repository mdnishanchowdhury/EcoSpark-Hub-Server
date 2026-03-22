import Stripe from "stripe";
import { prisma } from "../../lib/prisma";
import { PaymentStatus } from "../../../generated/prisma/enums";
import { generateInvoiceBuffer } from "../../utils/invoiceGenerator";
import { uploadFileToCloudinary } from "../../config/cloudinary.config";

const handlerStripeWebhookEvent = async (event: Stripe.Event) => {
    const existingPayment = await prisma.purchasedIdea.findFirst({
        where: { stripeEventId: event.id }
    });

    if (existingPayment) return { message: "Already processed" };

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as any;
            const transactionId = session.metadata?.transactionId;

            if (!transactionId) return { message: "Missing metadata" };

            const updatedPurchasedIdea = await prisma.$transaction(async (tx) => {
                return await tx.purchasedIdea.update({
                    where: { transactionId },
                    data: {
                        status: session.payment_status === "paid" ? PaymentStatus.PAID : PaymentStatus.FAILED,
                        paymentGatewayData: session,
                        stripeEventId: event.id
                    },
                    include: {
                        user: { select: { name: true, email: true } },
                        idea: { include: { category: true } }
                    }
                });
            });

            if (updatedPurchasedIdea.status === PaymentStatus.PAID) {
                try {
                    const invoiceData = {
                        orderId: transactionId,
                        buyerName: updatedPurchasedIdea.user.name || "User",
                        buyerEmail: updatedPurchasedIdea.user.email,
                        ideaTitle: updatedPurchasedIdea.idea.title,
                        categoryName: updatedPurchasedIdea.idea.category.name,
                        amount: updatedPurchasedIdea.amount
                    };

                    const pdfBuffer = await generateInvoiceBuffer(invoiceData);

                    const uploadResult = await uploadFileToCloudinary(
                        pdfBuffer,
                        `invoice-${transactionId}.pdf`
                    );

                    await prisma.purchasedIdea.update({
                        where: { id: updatedPurchasedIdea.id },
                        data: { invoiceUrl: uploadResult.secure_url }
                    });

                    console.log("Invoice upload successful:", uploadResult.secure_url);
                } catch (err) {
                    console.error("Invoice generation failed:", err);
                }
            }
            break;
        }

        case "checkout.session.expired":
        case "payment_intent.payment_failed": {
            const session = event.data.object as any;
            const transactionId = session.metadata?.transactionId;
            if (transactionId) {
                await prisma.purchasedIdea.update({
                    where: { transactionId },
                    data: { status: PaymentStatus.FAILED }
                });
            }
            break;
        }
    }
    return { message: "Webhook processed" };
};

const getSinglePurchasedIdeaByTransactionId = async (transactionId: string) => {
    const result = await prisma.purchasedIdea.findUnique({
        where: { transactionId },
        select: {
            id: true,
            transactionId: true,
            status: true,
            invoiceUrl: true,
            amount: true,
            createdAt: true,
            idea: {
                select: { title: true }
            }
        }
    });
    return result;
};

export const PurchasedIdeaService = {
    handlerStripeWebhookEvent,
    getSinglePurchasedIdeaByTransactionId
};