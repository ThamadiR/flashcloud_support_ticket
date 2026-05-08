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
  search = "",
  status = ""
): Promise<PaginatedTickets> {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  // Search and status conditions
  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push(`(subject LIKE ? OR author LIKE ? OR company LIKE ?)`);
    const searchValue = `%${search}%`;
    params.push(searchValue, searchValue, searchValue);
  }

  if (status) {
    whereClauses.push(`state = ?`);
    params.push(status);
  }

  const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // Total count
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM tbl_ticket_det ${whereClause}`,
    params
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  // Items
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
      GREATEST(TIMESTAMPDIFF(DAY, created_at, NOW()), 0) AS daysAgo,
      GREATEST(TIMESTAMPDIFF(DAY, due_at, NOW()), 0) AS overdueBy,
      UPPER(LEFT(TRIM(author), 1)) AS initial
    FROM tbl_ticket_det
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?;
    `,
    [...params, limit, offset]
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
      t.id,
      t.subject,
      t.status,
      t.author,
      t.company,
      t.priority,
      t.group_type,
      t.state,
      (
        SELECT COALESCE(
          (SELECT sender FROM tbl_email_receive WHERE ticket_id = t.id ORDER BY date_received ASC LIMIT 1),
          (SELECT sender_email FROM tbl_ticket_email_det WHERE subject = t.subject OR subject LIKE CONCAT('%', t.subject, '%') ORDER BY date_received ASC LIMIT 1)
        )
      ) as email,
      GREATEST(TIMESTAMPDIFF(DAY, t.created_at, NOW()), 0) AS daysAgo,
      GREATEST(TIMESTAMPDIFF(DAY, t.due_at, NOW()), 0) AS overdueBy,
      UPPER(LEFT(TRIM(t.author), 1)) AS initial
    FROM tbl_ticket_det t
    WHERE t.id = ?
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

export async function deleteTicketById(id: number) {
  await pool.query(`DELETE FROM tbl_email_receive WHERE ticket_id = ?`, [id]);
  await pool.query(`DELETE FROM tbl_ticket_det WHERE id = ?`, [id]);
  return true;
}
