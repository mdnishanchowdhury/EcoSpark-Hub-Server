import { Router } from "express";
import { CategoryController } from "./category.controller";

const router = Router();

router.post('/', CategoryController.createCategory);
router.get('/', CategoryController.getAllCategory);
router.get('/:id', CategoryController.getCategoryById);
router.delete('/:id', CategoryController.deleteCategory);

export const CategoryRoutes = router;