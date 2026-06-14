import express, { Router } from "express";
import { start, answer, feedback, getSession, speech, transcribe, getToken } from "../controllers/interview.controller";
const router = Router();

router.post("/start", start);
router.post("/answer", answer);
router.get("/feedback", feedback);
router.get("/session", getSession);
router.post("/speech", speech);
router.post("/transcribe", express.raw({ type: "audio/*", limit: "15mb" }), transcribe);
router.get("/token", getToken);
export default router;


