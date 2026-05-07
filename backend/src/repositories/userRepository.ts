import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

interface ManagementRow extends RowDataPacket {
  userId: number;
  userName: string;
  Email: string;
  role: string;
}

export class UserRepository {

  async findByEmail(email: string): Promise<ManagementRow | null> {
    const [rows] = await pool.execute<ManagementRow[]>(
      'SELECT * FROM `Management` WHERE `Email` = ?',
      [email]
    );
    return rows[0] ?? null;
  }

  async findById(id: number) {
    const [rows]: any = await pool.execute(
      'SELECT `userId` AS id, `userName` AS username, `email`, `contactNo`, `role`, `img`, `password`, `name` AS firstName, `lastName` FROM `Management` WHERE `userId` = ?',
      [id]
    );
    return rows[0] || null;
  }

  async findByUsername(username: string) {
    const [rows]: any = await pool.execute(
      'SELECT `userId` AS id, `userName` AS username, `email`, `contactNo`, `role`, `img`, `password`, `name` AS firstName, `lastName` FROM `Management` WHERE `userName` = ?',
      [username]
    );
    return rows[0] || null;
  }

  async findByIdWithBasicFields(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT \`userId\` AS id, \`userName\` AS username, \`email\`, \`role\`
       FROM \`Management\`
       WHERE \`userId\` = ?`,
      [id]
    );
    return rows[0] ?? null;
  }
  async findByIdWithProfileFields(id: number) {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT \`userId\` AS id, \`userName\` AS username, \`email\`, \`contactNo\`, \`role\`, \`img\`, \`name\` AS firstName, \`lastName\`
       FROM \`Management\`
       WHERE \`userId\` = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async findLastByIdDesc() {
    const [rows] = await pool.execute<ManagementRow[]>(
      'SELECT * FROM `Management` ORDER BY `userId` DESC LIMIT 1'
    );
    return rows[0] ?? null;
  }

  async createUser(data: any) {
    const keys = Object.keys(data);
    const columns = keys.map(k => `\`${k}\``).join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const values = Object.values(data);

    await pool.execute(
      `INSERT INTO \`Management\` (${columns}) VALUES (${placeholders})`,
      values
    );

    return data;
  }

  async updateUser(id: number, data: any) {
    const keys = Object.keys(data);
    if (keys.length === 0) return this.findById(id);

    const setClause = keys.map(k => `\`${k}\` = ?`).join(', ');
    const values = Object.values(data);
    values.push(id);

    await pool.execute(
      `UPDATE \`Management\` SET ${setClause} WHERE \`userId\` = ?`,
      values
    );

    return this.findById(id);
  }

  async deleteUser(id: number) {
    await pool.execute('DELETE FROM `Management` WHERE `userId` = ?', [id]);
  }

  async countUsers(where?: any) {
    if (where && where.role) {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM `Management` WHERE `role` = ?', [where.role]);
      return rows[0]?.count || 0;
    }
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM `Management`');
    return rows[0]?.count || 0;
  }

  async findManyUsers(args: any) {
    // Basic catch-all to return all users if dynamic args are passed
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT `userId` AS id, `userName` AS username, `Email` AS email, `contactNo`, `role`, `img` FROM `Management`');
    return rows;
  }

  async countAdmins() {
    const [rows] = await pool.execute<RowDataPacket[]>('SELECT COUNT(*) as count FROM `Management` WHERE `role` = "ADMIN"');
    return rows[0]?.count || 0;
  }

  async findAllUsernames(): Promise<string[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      'SELECT `userName` FROM `Management` ORDER BY `userName` ASC'
    );
    return rows.map((r: any) => r.userName);
  }
}
