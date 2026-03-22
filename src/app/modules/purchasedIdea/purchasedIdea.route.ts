import { Router } from "express";
import { purchasedIdeaController } from "./purchasedIdea.controller";

const router = Router();

router.get(
    "/:id",
    purchasedIdeaController.getSinglePurchasedIdeaByTransactionId
);

export const PaymentRoutes = router;