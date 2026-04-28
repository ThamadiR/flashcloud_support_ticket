
import pool from './src/config/db';

async function main() {
  console.log("Attempting to insert a test record...");
  try {
    const username = 'testuser2';
    const email = 'test2' + Date.now() + '@example.com';
    const password = 'abc';

    const [result] = await pool.execute(
      'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );
    
    console.log('SUCCESS! Record inserted successfully:', result);
  } catch(e: any) {
    console.error('ERROR OCCURRED DURING INSERTION:');
    console.error(e.message);
  } finally {
    await pool.end();
  }
}

main();
