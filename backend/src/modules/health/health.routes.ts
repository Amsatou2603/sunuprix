import { Router } from "express";
import { verifierSante } from "./health.controller";

const router = Router();

router.get("/", verifierSante);

export default router;
