import { Router } from "express";
import { CategoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema } from "./category.validation";

const router = Router();

router.post('/', validateRequest(createCategorySchema), CategoryController.createCategory);
router.get('/', CategoryController.getAllCategory);
router.get('/:id', CategoryController.getCategoryById);
router.delete('/:id', CategoryController.deleteCategory);

export const CategoryRoutes = router;