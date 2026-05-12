import { Router } from "express";
import {
  getDashboardSummary,
  getGroupSummary,
} from "../controllers/dashboardController";

const router = Router();

router.get("/summary", getDashboardSummary);
router.get("/group-summary", getGroupSummary);

export default router;