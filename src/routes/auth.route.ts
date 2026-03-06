import { Router } from "express";
import * as AuthController from "../controllers/auth.controller";
import { validateDto } from "../middlewares/validate.middleware";
import { LoginDto, ChangePasswordDto } from "../dtos/auth.dto";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", validateDto(LoginDto), AuthController.login);
router.post("/logout", authMiddleware, AuthController.logout);
router.put("/change-password", authMiddleware, validateDto(ChangePasswordDto), AuthController.changePassword);

export default router;
