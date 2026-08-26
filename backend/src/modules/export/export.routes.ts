import { Router } from "express";
import { authentifier } from "../../middlewares/auth.middleware";
import { autoriserRoles } from "../../middlewares/role.middleware";
import * as exportController from "./export.controller";

const router = Router();

router.get("/csv", authentifier, autoriserRoles("CHERCHEUR"), exportController.exporterCsv);

export default router;
