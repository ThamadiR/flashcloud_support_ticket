import type { Request, Response } from "express";
import {
  getRoles,
  getRoleById,
  Role,
  createRole,
} from "../models/RoleModel.js";

//fetch all roles
export async function fetchRoles(req: Request, res: Response) {
  try {
    const roles: Role[] = await getRoles();
    res.status(200).json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    res.status(500).json({ message: "Failed to fetch roles" });
  }
}

//fetch role by id
export async function fetchRoleById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ message: "Invalid role ID" });
  }

  try {
    const role = await getRoleById(id);
    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }
    res.status(200).json(role);
  } catch (error) {
    console.error("Error fetching role:", error);
    res.status(500).json({ message: "Failed to fetch role" });
  }
}

//create role
export async function createNewRole(req: Request, res: Response) {
  const { role_name, status } = req.body;

  if (!role_name || !status) {
    return res
      .status(400)
      .json({ message: "Role name and status are required" });
  }

  try {
    const insertId = await createRole(role_name, status);
    res.status(201).json({
      message: "Role created successfully",
      role_id: insertId,
    });
  } catch (error) {
    console.error("Error creating role:", error);
    res.status(500).json({ message: "Failed to create role" });
  }
}
