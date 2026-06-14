import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import User from "../models/user.model";
import { AuthRequest } from "../types";
const router = Router();

router.get("/history", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const user = await User.findOne({
    _id: userId,
  });
  const feedbackHistory = user?.feedbackHistory;

  return res.json(feedbackHistory);
});

export default router;
