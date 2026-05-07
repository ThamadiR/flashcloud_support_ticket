import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function syncDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '192.168.10.3',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'passw0rd',
    database: process.env.DB_NAME || 'support_db',
    port: Number(process.env.DB_PORT || 3306),
  });

  try {
    const [columns]: any = await connection.execute('DESCRIBE Management');
    const columnNames = columns.map((c: any) => c.Field);

    console.log('Current columns:', columnNames);

    // Rename 'name' to 'firstName' if it exists and 'firstName' doesn't
    if (columnNames.includes('name') && !columnNames.includes('firstName')) {
      console.log('Renaming name to firstName...');
      await connection.execute('ALTER TABLE Management CHANGE COLUMN name firstName VARCHAR(255);');
    }

    // Add missing columns
    const columnsToAdd = [
      { name: 'lastName', type: 'VARCHAR(255)' },
      { name: 'country', type: 'VARCHAR(255)' },
      { name: 'countryCode', type: 'VARCHAR(10)' },
      { name: 'img', type: 'VARCHAR(255)' },
      { name: 'contactNo', type: 'VARCHAR(20)' }, // Changing to VARCHAR for better phone support
    ];

    for (const col of columnsToAdd) {
      if (!columnNames.includes(col.name)) {
        console.log(`Adding ${col.name}...`);
        await connection.execute(`ALTER TABLE Management ADD COLUMN ${col.name} ${col.type};`);
      }
    }

    // Ensure contactNo is VARCHAR if it's currently INT
    const contactNoCol = columns.find((c: any) => c.Field === 'contactNo');
    if (contactNoCol && contactNoCol.Type.includes('int')) {
      console.log('Changing contactNo to VARCHAR(20)...');
      await connection.execute('ALTER TABLE Management MODIFY COLUMN contactNo VARCHAR(20);');
    }

    console.log('Database sync complete!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await connection.end();
  }
}

syncDatabase();
