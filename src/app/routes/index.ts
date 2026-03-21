import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.route";
import { IdeaRoutes } from "../modules/idea/idea.route";

const router = Router();

router.use("/category", CategoryRoutes);
router.use("/idea", IdeaRoutes);

export const IndexRoutes = router;