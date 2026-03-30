import { Router } from "express";
import { checkAuth } from "../../middleware/checkAuth";
import { CommentController } from "./comment.controller";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    checkAuth(Role.MEMBER, Role.ADMIN),
    CommentController.createComment
);

router.patch(
    "/:id",
    checkAuth(Role.MEMBER, Role.ADMIN),
    CommentController.updateComment
);

router.delete(
    "/:id",
    checkAuth(Role.MEMBER, Role.ADMIN),
    CommentController.deleteComment
);

export const CommentRoutes = router;