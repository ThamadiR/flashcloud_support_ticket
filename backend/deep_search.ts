import { pool } from './src/config/db';

async function searchAll(term: string) {
    const [tables]: any = await pool.query('SHOW TABLES');
    for (const tableObj of tables) {
        const table = Object.values(tableObj)[0] as string;
        try {
            const [cols]: any = await pool.query(`DESCRIBE \`${table}\``);
            const textCols = cols.filter((c: any) => 
                c.Type.includes('text') || c.Type.includes('char') || c.Type.includes('longtext')
            ).map((c: any) => c.Field);

            if (textCols.length > 0) {
                const whereClause = textCols.map((c: string) => `\`${c}\` LIKE ?`).join(' OR ');
                const query = `SELECT * FROM \`${table}\` WHERE ${whereClause}`;
                const [rows]: any = await pool.query(query, textCols.map(() => `%${term}%`));
                if (rows.length > 0) {
                    console.log(`FOUND IN ${table}: ${rows.length} rows`);
                    if (table === 'tbl_email_receive' || table === 'tbl_ticket_email_det' || table === 'tickets') {
                        rows.forEach((r: any) => console.log('  ID:', r.id, 'Subject:', r.subject));
                    }
                }
            }
        } catch (e) {
            // Skip tables that fail
        }
    }
}

async function run() {
    console.log('--- Searching for "Leave Request" ---');
    await searchAll('Leave Request');
    console.log('--- Searching for "632" ---');
    await searchAll('632');
    process.exit(0);
}

run();
