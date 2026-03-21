import { Router } from "express";
import { VoteController } from "./vote.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post(
    "/",
    checkAuth(Role.MEMBER, Role.ADMIN),
    VoteController.handleVote
);

export const VoteRoutes = router;