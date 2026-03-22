import { Router } from "express";
import { IdeaController } from "./idea.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { createIdeaSchema, updateIdeaStatusSchema } from "./idea.validation";

const router = Router();

router.get("/pending-ideas",
    checkAuth(Role.ADMIN),
    IdeaController.getPendingIdeasForAdmin
);

router.get(
    "/my-ideas",
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.getMyIdeas
);

router.get("/", checkAuth(Role.MEMBER, Role.ADMIN), IdeaController.getAllIdeas);

router.post("/initiate-payment/:ideaId",
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.initiateIdeaPayment
);

router.get("/:id",
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.getIdeaById
);

router.post("/",
    validateRequest(createIdeaSchema),
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.createIdea
);

router.patch('/update-status/:id',
    validateRequest(updateIdeaStatusSchema),
    checkAuth(Role.ADMIN),
    IdeaController.updateIdeaStatus
);

export const IdeaRoutes = router;