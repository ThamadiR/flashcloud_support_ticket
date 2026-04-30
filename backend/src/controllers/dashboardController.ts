import { Request, Response } from "express";
import { pool } from "../config/db";

export async function getDashboardSummary(req: Request, res: Response) {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        COUNT(*) AS allTickets,
        SUM(state != 'Resolved') AS pendingTickets,
        SUM(state = 'Resolved') AS resolvedTickets
      FROM tbl_ticket_det
    `);

    res.json({
      all: rows[0].allTickets,
      pending: rows[0].pendingTickets,
      resolved: rows[0].resolvedTickets,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    res.status(500).json({ error: "Failed to load dashboard summary" });
  }
}

export async function getGroupSummary(req: Request, res: Response) {
  try {
    const [rows]: any = await pool.query(`
      SELECT
        group_type AS \`group\`,
        COUNT(*) AS \`all\`,
        SUM(state != 'Resolved') AS pending,
        SUM(state = 'Resolved') AS resolved
      FROM tbl_ticket_det
      GROUP BY group_type
      ORDER BY group_type
    `);

    res.json(rows);
  } catch (err) {
    console.error("Group summary error:", err);
    res.status(500).json({ error: "Failed to load group summary" });
  }
}
