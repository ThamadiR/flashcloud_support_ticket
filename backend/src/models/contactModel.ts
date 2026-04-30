import { pool } from "../config/db.js";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

export type Contact = {
  id: number;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string;
  company: string | null;
  profileImage: string | null;
  createdAt: string;
};

export type PaginatedContacts = {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getContacts(
  page = 1,
  pageSize = 100
): Promise<PaginatedContacts> {
  const limit = pageSize;
  const offset = (page - 1) * pageSize;

  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM contacts`
  );
  const total = Number((countRows[0] as any)?.total ?? 0);

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      id,
      first_name AS firstName,
      last_name  AS lastName,
      phone,
      email,
      company,
      profile_image AS profileImage,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM contacts
    ORDER BY id DESC
    LIMIT ? OFFSET ?;
    `,
    [limit, offset]
  );

  return {
    items: rows as unknown as Contact[],
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function createContact(input: {
  firstName: string;
  lastName: string;
  phone?: string | null;
  email: string;
  company?: string | null;
  profileImage?: string | null; // e.g., "/uploads/xyz.jpg"
}): Promise<Contact> {
  const {
    firstName,
    lastName,
    phone = null,
    email,
    company = null,
    profileImage = null,
  } = input;

  const [result] = await pool.query<ResultSetHeader>(
    `
    INSERT INTO contacts
    (first_name, last_name, phone, email, company, profile_image)
    VALUES (?, ?, ?, ?, ?, ?);
    `,
    [firstName, lastName, phone, email, company, profileImage]
  );

  const insertedId = result.insertId;

  const [rows] = await pool.query<RowDataPacket[]>(
    `
    SELECT
      id,
      first_name AS firstName,
      last_name  AS lastName,
      phone,
      email,
      company,
      profile_image AS profileImage,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS createdAt
    FROM contacts
    WHERE id = ?;
    `,
    [insertedId]
  );

  return rows[0] as unknown as Contact;
}

export async function getContactById(id: number) {
  const [rows] = await pool.query("SELECT * FROM contacts WHERE id = ?", [id]);
  const contacts = rows as any[];
  return contacts.length ? contacts[0] : null;
}

export async function updateContact(id: number, contact: Contact) {
  const { firstName, lastName, phone, email, company, profileImage } = contact;

  await pool.query(
    `
    UPDATE contacts
    SET first_name = ?, last_name = ?, phone = ?, email = ?, company = ?, profile_image = ?
    WHERE id = ?;
    `,
    [firstName, lastName, phone, email, company, profileImage, id]
  );

  const updated = await getContactById(id);
  return updated;
}

export async function deleteContact(id: number) {
  await pool.query("DELETE FROM contacts WHERE id = ?", [id]);
}
