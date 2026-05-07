import { pool } from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Company = {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  contacts: number; // computed
  createdAt: string; // from created_at
};

export type NewCompanyInput = {
  name: string;
  description?: string;
  email?: string;
  tenant_count?: number;
};

export async function listCompanies(): Promise<Company[]> {
  const sql = `
    SELECT
      id,
      name,
      email,
      tenant_count,
      created_at,
      updated_at
    FROM companyList;
  `;
  const [rows] = await pool.query<RowDataPacket[]>(sql);
  return rows.map((r) => ({
    id: Number(r.id),
    name: String(r.name || ''),
    phone: 'N/A',
    email: r.email ? String(r.email) : null,
    address: 'N/A',
    contacts: 0,
    createdAt: r.created_at ? String(r.created_at) : '—',
    tenant_count: r.tenant_count ?? 0,
    updated_at: r.updated_at ? String(r.updated_at) : '—',
  }));
}

export async function createCompany(input: NewCompanyInput): Promise<any> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO companyList (name, description, email, tenant_count)
     VALUES (?, ?, ?, ?)`,
    [
      input.name,
      input.description ?? null,
      input.email ?? null,
      input.tenant_count ?? 0,
    ]
  );

  const insertedId = result.insertId;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       c.id, c.name, c.email, c.description, c.tenant_count, c.created_at AS createdAt
     FROM companyList c
     WHERE c.id = ?`,
    [insertedId]
  );

  return rows[0];
}

export async function getContactsByCompanyId(companyId: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      id,
      first_name AS firstName,
      last_name AS lastName,
      phone,
      email,
      company,
      profile_image AS profileImage,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM contacts
    WHERE company = (
      SELECT name FROM companyList WHERE id = ?
    )
    ORDER BY id DESC;
    `,
    [companyId]
  );

  return rows;
}

export async function updateCompanyById(
  id: number,
  name: string,
  description?: string,
  email?: string,
  tenant_count?: number
) {
  await pool.query(
    `
      UPDATE companyList 
      SET name = ?, description = ?, email = ?, tenant_count = ?
      WHERE id = ?
    `,
    [name, description || null, email || null, tenant_count || 0, id]
  );
}

export async function deleteCompanyById(id: number) {
  await pool.query("DELETE FROM companyList WHERE id = ?", [id]);
}
