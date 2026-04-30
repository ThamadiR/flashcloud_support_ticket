import { Request, Response } from "express";
import { getAssignees } from "../models/userModel.js";

export async function fetchAssignees(req: Request, res: Response) {
  try {
    const assignees = await getAssignees();
    res.json(assignees);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch assignees" });
  }
}
