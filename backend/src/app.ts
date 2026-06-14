import express from "express";
import authRoutes from "./routes/auth.routes";
import userRouter from "./routes/user.route";
import cors from "cors";
import interviewRouter from "./routes/interview.routes";
import { authMiddleware } from "./middleware/auth.middleware";
const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL! }));
app.use("/api/auth", authRoutes);
app.use("/api/user", authMiddleware, userRouter);
app.use("/api/interview", authMiddleware, interviewRouter);
export default app;
