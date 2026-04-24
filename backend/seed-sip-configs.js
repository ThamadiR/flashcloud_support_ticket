const { Client } = require('pg');
require('dotenv').config();

const SAMPLE_CONFIGS = [
  {
    sipCount: 2,
    sipProvider: 'Twilio SIP',
    sipChannelCount: 8,
    sipDescription: 'Primary SIP trunk for inbound and outbound calling',
    licenseCount: 4,
  },
  {
    sipCount: 4,
    sipProvider: 'Plivo SIP',
    sipChannelCount: 12,
    sipDescription: 'Secondary SIP route for failover traffic',
    licenseCount: 6,
  },
  {
    sipCount: 1,
    sipProvider: 'Zoom SIP',
    sipChannelCount: 5,
    sipDescription: 'Low-volume SIP setup for support team calls',
    licenseCount: 2,
  },
  {
    sipCount: 3,
    sipProvider: 'Vonage SIP',
    sipChannelCount: 10,
    sipDescription: 'Dedicated SIP channel pool for sales operations',
    licenseCount: 5,
  },
  {
    sipCount: 5,
    sipProvider: 'Cisco SIP',
    sipChannelCount: 16,
    sipDescription: 'High-capacity SIP configuration for production use',
    licenseCount: 8,
  },
];

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  try {
    const tenantsResult = await client.query(
      'SELECT id, company_id, name FROM public.tenants ORDER BY id ASC LIMIT 10'
    );

    const tenants = tenantsResult.rows;
    if (tenants.length === 0) {
      console.log('No tenants found. Seed tenants first, then run this script again.');
      return;
    }

    await client.query('DELETE FROM public.sip_configs');

    let inserted = 0;
    for (let index = 0; index < tenants.length; index += 1) {
      const tenant = tenants[index];
      const sample = SAMPLE_CONFIGS[index % SAMPLE_CONFIGS.length];

      await client.query(
        `
          INSERT INTO public.sip_configs (
            tenant_id,
            sip_count,
            sip_provider,
            sip_channel_count,
            sip_description,
            license_count
          ) VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [
          tenant.id,
          sample.sipCount,
          `${sample.sipProvider} for ${tenant.name}`,
          sample.sipChannelCount,
          `${sample.sipDescription} (${tenant.name})`,
          sample.licenseCount,
        ]
      );
      inserted += 1;
    }

    const totalResult = await client.query('SELECT COUNT(*)::int AS total FROM public.sip_configs');
    const sampleRows = await client.query(
      `
        SELECT
          sc.id,
          sc.tenant_id,
          t.name AS tenant_name,
          sc.sip_count,
          sc.sip_provider,
          sc.sip_channel_count,
          sc.sip_description,
          sc.license_count
        FROM public.sip_configs sc
        LEFT JOIN public.tenants t ON t.id = sc.tenant_id
        ORDER BY sc.id ASC
        LIMIT 5
      `
    );

    console.log(`Inserted ${inserted} sip config rows.`);
    console.log(`Total sip configs in table: ${totalResult.rows[0].total}`);
    console.log('Sample rows:', JSON.stringify(sampleRows.rows, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error('Error seeding sip configs:', error);
  process.exit(1);
});