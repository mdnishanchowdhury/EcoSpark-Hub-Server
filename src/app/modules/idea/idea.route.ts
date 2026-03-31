import { Router } from "express";
import { IdeaController } from "./idea.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/client";
import { validateRequest } from "../../middleware/validateRequest";
import { createIdeaSchema, updateIdeaStatusSchema } from "./idea.validation";
import { checkAuthOptional } from "../../middleware/checkAuthOptional";
import { multerUpload } from "../../config/multer.config";

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

router.get("/", checkAuthOptional, IdeaController.getAllIdeas);

router.post("/",
    checkAuth(Role.MEMBER, Role.ADMIN),
    multerUpload.array("images", 5),
    validateRequest(createIdeaSchema),
    IdeaController.createIdea
);

router.get("/:id",
    checkAuthOptional,
    IdeaController.getIdeaById
);

router.post("/",
    validateRequest(createIdeaSchema),
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.createIdea
);

router.patch('/update-status/:id',
    // validateRequest(updateIdeaStatusSchema),
    checkAuth(Role.ADMIN),
    IdeaController.updateIdeaStatus
);

router.post("/initiate-payment/:ideaId",
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.initiateIdeaPayment
);

router.patch("/edit/:id",
    checkAuth(Role.MEMBER, Role.ADMIN),
    multerUpload.array("images", 5),
    // validateRequest(updateIdeaSchema), 
    IdeaController.updateIdea
);

router.delete("/:id",
    checkAuth(Role.MEMBER, Role.ADMIN),
    IdeaController.deleteIdea
);


export const IdeaRoutes = router;