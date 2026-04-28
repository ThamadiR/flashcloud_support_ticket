// src/types/db.types.ts
export interface User {
  id:         number;
  username:   string;
  email:      string;
  password:   string;
  contactNo:  string;
  role:       string;
  created_at: Date;
}

export interface Company {
  id:          number;
  name:        string;
  description: string;
  email:       string;
  created_at:  Date;
}

import pool from './src/config/db';
import mysql from 'mysql2/promise';

async function main(): Promise<void> {
  try {
    console.log('Sending insert...');

    const username = 'testuser3';
    const email = `test3${Date.now()}@example.com`;
    const password = 'abc';

    const [result] = await pool.execute<mysql.ResultSetHeader>(
      'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );

    console.log('SUCCESS! User inserted with ID:', result.insertId);

  } catch (e: unknown) {
    console.error('ERROR OCCURRED:');
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
  } finally {
    await pool.end();
  }
}

main();