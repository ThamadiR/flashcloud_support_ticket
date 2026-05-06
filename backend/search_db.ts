import { pool } from './src/config/db';

async function searchEverywhere(term: string) {
  console.log(`--- Searching for "${term}" everywhere ---`);
  
  const [tables]: any = await pool.query('SHOW TABLES');
  for (const row of tables) {
    const table = Object.values(row)[0] as string;
    const [cols]: any = await pool.query(`DESCRIBE ${table}`);
    
    for (const col of cols) {
        const field = col.Field;
        const type = col.Type.toLowerCase();
        
        // Only search in string/text columns
        if (type.includes('char') || type.includes('text')) {
            try {
                const [rows]: any = await pool.query(`SELECT * FROM ${table} WHERE \`${field}\` LIKE ? LIMIT 1`, [`%${term}%`]);
                if (rows.length > 0) {
                    console.log(`FOUND in [${table}.${field}]`);
                    // console.log(rows[0]);
                }
            } catch (e) {
                // Skip errors (e.g. invalid columns)
            }
        }
    }
  }

  process.exit(0);
}

const term = process.argv[2] || '327464';
searchEverywhere(term);
