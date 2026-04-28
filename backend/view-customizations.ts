import 'dotenv/config';
import pool from './src/config/db';
import { RowDataPacket } from 'mysql2';

interface CustomizationRow extends RowDataPacket {
  id:              number;
  name:            string;
  description:     string;
  subsection_id:   number;
  company_id:      number;
  subsection_name: string;
  section_id:      number;
}

async function viewCustomizations(): Promise<void> {
  try {
    const [customizations] = await pool.execute<CustomizationRow[]>(
      `SELECT
        c.id,
        c.name,
        c.description,
        c.subsection_id,
        c.company_id,
        cs.name       AS subsection_name,
        cs.section_id AS section_id
       FROM \`customization\` c
       LEFT JOIN \`customization_subsections\` cs ON cs.id = c.subsection_id
       ORDER BY c.id ASC`
    );

    console.log(JSON.stringify(customizations, null, 2));

  } catch (error: unknown) {
    console.error('Error fetching customizations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

viewCustomizations();