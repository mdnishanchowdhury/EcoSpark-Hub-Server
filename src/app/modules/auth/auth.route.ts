import { Router } from "express";
import { AuthController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const router = Router();

router.get("/me", checkAuth(Role.ADMIN, Role.MEMBER), AuthController.getMe);

router.post("/register", AuthController.registerMember)
router.post("/login", AuthController.loginMember)

router.post("/change-password", checkAuth(Role.ADMIN, Role.MEMBER), AuthController.changePassword)

router.post("/verify-email", AuthController.verifyEmail);
router.post("/logout", checkAuth(Role.ADMIN, Role.MEMBER), AuthController.logoutUser)

export const AuthRoutes = router;