import { pool } from "../config/db.js";
import type { RowDataPacket } from "mysql2/promise";

export type Ticket = {
  id: number;
  subject: string;
  status: string;
  author: string;
  company: string;
  priority: string;
  group_type: string;
  state: string;
  daysAgo: number;
  overdueBy: number;
  initial?: string;
  email?: string;
};

export type PaginatedTickets = {
  items: Ticket[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getTickets(
  page = 1,
  pageSize = 6,
  search = ""
): Promise<PaginatedTickets> {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  // Search condition
  const searchCondition = search
    ? `WHERE subject LIKE ? OR author LIKE ? OR company LIKE ?`
    : "";

  const searchValue = `%${search}%`;

  // Total count
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM tbl_ticket_det ${searchCondition}`,
    search ? [searchValue, searchValue, searchValue] : []
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  // Items (compute fields to match your frontend)
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      id,
      subject,
      status,
      author,
      company,
      priority,
      group_type,
      state,
      -- days since created
      GREATEST(TIMESTAMPDIFF(DAY, created_at, NOW()), 0) AS daysAgo,
      -- overdue days (0 if not overdue yet)
      GREATEST(TIMESTAMPDIFF(DAY, due_at, NOW()), 0) AS overdueBy,
      -- initial from author's first non-empty char
      UPPER(LEFT(TRIM(author), 1)) AS initial
    FROM tbl_ticket_det
    ${searchCondition}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
    `,
    search
      ? [searchValue, searchValue, searchValue, limit, offset]
      : [limit, offset]
  );

  const items = rows as unknown as Ticket[];
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getTicketById(id: number): Promise<Ticket | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      id,
      subject,
      status,
      author,
      company,
      priority,
      group_type,
      state,
      email,
      GREATEST(TIMESTAMPDIFF(DAY, created_at, NOW()), 0) AS daysAgo,
      GREATEST(TIMESTAMPDIFF(DAY, due_at, NOW()), 0) AS overdueBy,
      UPPER(LEFT(TRIM(author), 1)) AS initial
    FROM tbl_ticket_det
    WHERE id = ?
    LIMIT 1;
    `,
    [id]
  );

  if (rows.length === 0) return null;
  return rows[0] as Ticket;
}

export async function updateTicketById(
  id: number,
  updates: {
    state?: string;
    priority?: string;
    group_type?: string;
    assignee?: string;
  }
) {
  const fields = [];
  const values: any[] = [];

  if (updates.state !== undefined) {
    fields.push("state = ?");
    values.push(updates.state);
  }
  if (updates.priority !== undefined) {
    fields.push("priority = ?");
    values.push(updates.priority);
  }
  if (updates.group_type !== undefined) {
    fields.push("group_type = ?");
    values.push(updates.group_type);
  }
  if (updates.assignee !== undefined) {
    fields.push("assignee = ?");
    values.push(updates.assignee);
  }

  if (fields.length === 0) return null;

  values.push(id);

  await pool.query(
    `UPDATE tbl_ticket_det SET ${fields.join(", ")} WHERE id = ?`,
    values
  );

  return true;
}
