import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.route";
import { IdeaRoutes } from "../modules/idea/idea.route";
import { VoteRoutes } from "../modules/vote/vote.route";

const router = Router();

router.use("/category", CategoryRoutes);
router.use("/idea", IdeaRoutes);
router.use("/votes", VoteRoutes);

export const IndexRoutes = router;