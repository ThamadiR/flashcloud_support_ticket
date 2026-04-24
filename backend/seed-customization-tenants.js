const { Client } = require('pg');
require('dotenv').config();

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const customizationRes = await client.query(
      'SELECT id FROM customization ORDER BY id ASC LIMIT 20'
    );
    const tenantRes = await client.query(
      'SELECT id FROM tenants ORDER BY id ASC LIMIT 20'
    );

    const customizationIds = customizationRes.rows.map((row) => row.id);
    const tenantIds = tenantRes.rows.map((row) => row.id);

    if (customizationIds.length === 0) {
      throw new Error('No customization records found. Seed customizations first.');
    }

    if (tenantIds.length === 0) {
      throw new Error('No tenant records found. Seed tenants first.');
    }

    const targetRows = 30;
    const pairs = [];

    for (let i = 0; i < targetRows; i += 1) {
      pairs.push({
        customizationId: customizationIds[i % customizationIds.length],
        tenantId: tenantIds[(i * 3) % tenantIds.length],
      });
    }

    const values = [];
    const placeholders = pairs
      .map((pair, index) => {
        const offset = index * 2;
        values.push(pair.customizationId, pair.tenantId);
        return `($${offset + 1}, $${offset + 2})`;
      })
      .join(', ');

    await client.query(
      `INSERT INTO customization_tenants (customization_id, tenant_id) VALUES ${placeholders}`,
      values
    );

    const total = await client.query('SELECT COUNT(*)::int AS count FROM customization_tenants');

    console.log(`Inserted ${pairs.length} customization_tenants rows.`);
    console.log(`Total rows now: ${total.rows[0].count}`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
