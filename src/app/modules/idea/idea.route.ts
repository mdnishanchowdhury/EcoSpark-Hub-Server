import { Router } from "express";
import { IdeaController } from "./idea.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
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

router.get("/", IdeaController.getAllIdeas);
router.get("/:id", IdeaController.getIdeaById);

router.post("/",
    validateRequest(createIdeaSchema),
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.createIdea
);

// admin

router.patch('/update-status/:id',
    validateRequest(updateIdeaStatusSchema),
    checkAuth(Role.ADMIN),
    IdeaController.updateIdeaStatus
);

export const IdeaRoutes = router;