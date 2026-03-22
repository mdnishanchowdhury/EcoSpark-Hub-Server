import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.route";
import { IdeaRoutes } from "../modules/idea/idea.route";
import { VoteRoutes } from "../modules/vote/vote.route";
import { CommentRoutes } from "../modules/comment/comment.route";

const router = Router();

router.use("/category", CategoryRoutes);
router.use("/idea", IdeaRoutes);
router.use("/vote", VoteRoutes);
router.use("/comment", CommentRoutes);

export const IndexRoutes = router;