import { Router } from "express";
import { CategoryRoutes } from "../modules/category/category.route";

const router = Router();

router.use("/category", CategoryRoutes);

export const IndexRoutes = router;