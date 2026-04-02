import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.route";
import { IdeaRoutes } from "../modules/idea/idea.route";
import { VoteRoutes } from "../modules/vote/vote.route";
import { CommentRoutes } from "../modules/comment/comment.route";
import { PaymentRoutes } from "../modules/purchasedIdea/purchasedIdea.route";
import { MetaRoutes } from "../modules/Meta/meta.routes";

const router = Router();

router.use("/category", CategoryRoutes);
router.use("/idea", IdeaRoutes);
router.use("/vote", VoteRoutes);
router.use("/comment", CommentRoutes);
router.use("/invoice", PaymentRoutes);
router.use("/meta", MetaRoutes);

export const IndexRoutes = router;