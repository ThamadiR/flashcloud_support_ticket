const { Client } = require('pg');

async function runQuery() {
    const client = new Client({
        connectionString: "postgresql://postgres:pasw0rd@localhost:5432/postgres?schema=public"
    });

    try {
        await client.connect();

        // 1. Total count of rows in customization
        const totalCountRes = await client.query('SELECT COUNT(*) FROM customization');
        console.log('Total count of rows in customization:', totalCountRes.rows[0].count);

        // 2. Count of rows grouped by company_id for the first few company ids
        const groupedRes = await client.query('SELECT company_id, COUNT(*) FROM customization GROUP BY company_id ORDER BY company_id LIMIT 5');
        console.log('Rows grouped by company_id (top 5):');
        console.table(groupedRes.rows);

        // 3. Sample row for company id 2
        const sampleRes = await client.query('SELECT id, name, subsection_id, company_id FROM customization WHERE company_id = 2 LIMIT 1');
        console.log('Sample row for company id 2:');
        if (sampleRes.rows.length > 0) {
            console.table(sampleRes.rows);
        } else {
            console.log('No rows found for company id 2.');
        }

    } catch (err) {
        console.error('Error executing query:', err.stack);
    } finally {
        await client.end();
    }
}

runQuery();
