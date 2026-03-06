import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import jwt from "jsonwebtoken";
import TokenBlacklist from '../models/tokenBlacklist.model';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ message: err.message });
  }
}

export const logout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(200).json({ message: "Logged out" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(200).json({ message: "Logged out" });
    }

    const decoded: any = jwt.decode(token);

    if (decoded?.exp) {
      await TokenBlacklist.create({
        token,
        expiresAt: new Date(decoded.exp * 1000),
      });
    }

    return res.json({ message: "Logout success" });
  } catch (error) {
    return res.status(500).json({ message: "Logout failed" });
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = (req as any).user.id; // Assuming auth middleware sets req.user
    const result = await AuthService.changePassword(userId, oldPassword, newPassword);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
}

