import { Router } from "express";
import { CategoryController } from "./category.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategorySchema } from "./category.validation";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.post('/', checkAuth(Role.ADMIN), validateRequest(createCategorySchema), CategoryController.createCategory);
router.get('/', CategoryController.getAllCategory);
router.get('/:id', CategoryController.getCategoryById);
router.delete('/:id', checkAuth(Role.ADMIN), CategoryController.deleteCategory);

export const CategoryRoutes = router;