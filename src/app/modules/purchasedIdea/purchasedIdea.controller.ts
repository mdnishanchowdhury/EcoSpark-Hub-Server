import { Request, Response } from "express";
import status from "http-status";
import { envVars } from "../../config/env";
import { stripe } from "../../config/stripe.config";
import { sendResponse } from "../../shared/sendResponse";
import { catchAsync } from "../../shared/catchAsnc";
import { PurchasedIdeaService } from "./purchasedIdea.service";

const handleStripeWebhookEvent = catchAsync(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = envVars.STRIPE.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
        return res.status(status.BAD_REQUEST).json({
            success: false,
            message: "Webhook Error: Missing signature or secret"
        });
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, signature, webhookSecret);
    } catch (error: any) {
        console.error("Stripe Webhook Signature Verification Failed:", error.message);
        return res.status(status.BAD_REQUEST).send(`Webhook Error: ${error.message}`);
    }
    const result = await PurchasedIdeaService.handlerStripeWebhookEvent(event);

    sendResponse(res, {
        httpStatusCode: status.OK,
        success: true,
        message: "Stripe webhook event processed successfully",
        data: result
    });
});

export const purchasedIdeaController = {
    handleStripeWebhookEvent
};