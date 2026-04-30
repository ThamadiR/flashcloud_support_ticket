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
  phone?: string;
  email?: string;
  address?: string;
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

export async function createCompany(input: NewCompanyInput): Promise<Company> {
  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO companyList (name, description, email)
     VALUES (?, ?, ?)`,
    [
      input.name,
      input.address ?? null,
      input.email ?? null,
    ]
  );

  const insertedId = result.insertId;

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       c.id, c.name, c.email, c.description AS address, c.created_at AS createdAt
     FROM companyList c
     WHERE c.id = ?`,
    [insertedId]
  );

  const row = rows[0];
  if (!row) {
    throw new Error("Failed to retrieve inserted company row.");
  }
  return {
    id: Number(row.id),
    name: String(row.name),
    phone: "N/A",
    email: row.email ? String(row.email) : null,
    address: row.address ? String(row.address) : null,
    contacts: 0,
    createdAt: String(row.createdAt),
  };
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
  companyName: string,
  phone?: string,
  email?: string,
  address?: string
) {
  await pool.query(
    `
      UPDATE companyList 
      SET name = ?, description = ?, email = ?
      WHERE id = ?
    `,
    [companyName, address || null, email || null, id]
  );
}

export async function deleteCompanyById(id: number) {
  await pool.query("DELETE FROM companyList WHERE id = ?", [id]);
}
