import { Client } from 'pg';

const connectionString: string = 'postgresql://postgres:pasw0rd@localhost:5432/postgres?schema=public';

interface TableNameRow {
  table_name: string;
}

interface ColumnInfoRow {
  column_name: string;
  data_type: string;
}

async function main(): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();

  const tablesRes = await client.query<TableNameRow>(
    `SELECT table_name 
     FROM information_schema.tables 
     WHERE table_schema = 'public' AND table_name LIKE 'customization%'`
  );

  const tables: string[] = tablesRes.rows.map((r) => r.table_name);

  for (const table of tables) {
    console.log('Table: ' + table);

    const colsRes = await client.query<ColumnInfoRow>(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = $1 AND table_schema = 'public'`,
      [table]
    );

    colsRes.rows.forEach((col) => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
  }

  await client.end();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});