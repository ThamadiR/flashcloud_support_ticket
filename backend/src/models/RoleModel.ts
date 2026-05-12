import { pool } from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Role = {
  id: number;
  role_name: string;
};

export async function getRoles(): Promise<Role[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      id, 
      role_name 
    FROM user_roles
    ORDER BY role_name ASC;
    `
  );

  return rows as Role[];
}

export async function getRoleById(id: number): Promise<Role | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT 
      id, 
      role_name 
    FROM user_roles
    WHERE id = ?
    LIMIT 1;
    `,
    [id]
  );

  if (rows.length === 0) return null;
  return rows[0] as Role;
}

export async function createRole(
  role_name: string,
  status: "active" | "inactive"
): Promise<number> {
  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO user_roles (role_name, status)
    VALUES (?, ?);
    `,
    [role_name, status]
  );

  return result.insertId;
}
