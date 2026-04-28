import 'dotenv/config';
import pool from './src/config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

interface SectionRow extends RowDataPacket {
  id:   number;
  name: string;
}

interface SubsectionRow extends RowDataPacket {
  id:         number;
  name:       string;
  section_id: number | null;
}

interface CompanyRow extends RowDataPacket {
  id:   number;
  name: string;
}

const SUBSECTIONS = [
  { name: 'General Settings',    section: 'General'    },
  { name: 'Account Settings',    section: 'General'    },
  { name: 'UI Customization',    section: 'Appearance' },
  { name: 'Theme Settings',      section: 'Appearance' },
  { name: 'Advanced Options',    section: 'Advanced'   },
  { name: 'Integration',         section: 'Advanced'   },
  { name: 'Notification Rules',  section: 'Workflow'   },
  { name: 'Automation',          section: 'Workflow'   },
  { name: 'Security',            section: 'Security'   },
  { name: 'API Access',          section: 'Security'   },
];

const SECTIONS = ['General', 'Appearance', 'Advanced', 'Workflow', 'Security'];

const CUSTOMIZATIONS = [
  { name: 'Color Scheme',             description: 'Choose between light, dark, and auto themes'    },
  { name: 'Font Size',                description: 'Adjust the application font size'               },
  { name: 'Language',                 description: 'Select your preferred language'                 },
  { name: 'Timezone',                 description: 'Set your timezone for date and time displays'   },
  { name: 'Notification Preferences', description: 'Configure notification settings'                },
  { name: 'Data Export Format',       description: 'Choose default format for data exports'         },
  { name: 'API Key Management',       description: 'Generate and manage API keys'                   },
  { name: 'Authentication Method',    description: 'Configure preferred authentication methods'     },
  { name: 'Dashboard Layout',         description: 'Customize dashboard widget arrangement'         },
  { name: 'Default Currency',         description: 'Set the default currency for transactions'      },
];

async function main(): Promise<void> {
  try {
    console.log('Seeding customization subsections...');

    // ── Clear existing data ──────────────────────────────────────────────
    await pool.execute('DELETE FROM `customization`');
    await pool.execute('DELETE FROM `customization_subsections`');
    await pool.execute('DELETE FROM `customization_sections`');

    // ── Seed Sections ────────────────────────────────────────────────────
    const sectionByName = new Map<string, number>();

    for (const name of SECTIONS) {
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO `customization_sections` (`name`) VALUES (?)',
        [name]
      );
      sectionByName.set(name, result.insertId);
    }

    console.log(`Created ${SECTIONS.length} sections`);

    // ── Seed Subsections ─────────────────────────────────────────────────
    const subsectionIds: number[] = [];

    for (const subsection of SUBSECTIONS) {
      const sectionId = sectionByName.get(subsection.section) ?? null;
      const [result] = await pool.execute<ResultSetHeader>(
        'INSERT INTO `customization_subsections` (`name`, `section_id`) VALUES (?, ?)',
        [subsection.name, sectionId]
      );
      subsectionIds.push(result.insertId);
    }

    console.log(`Created ${subsectionIds.length} subsections`);

    // ── Fetch Companies ──────────────────────────────────────────────────
    const [companies] = await pool.execute<CompanyRow[]>(
      'SELECT `id`, `name` FROM `companyList` ORDER BY `id` ASC'
    );

    if (companies.length === 0) {
      throw new Error('No companies found for customization seeding');
    }

    // ── Seed Customizations ──────────────────────────────────────────────
    let customizationCount = 0;

    for (const company of companies) {
      let index = 0;
      for (const customization of CUSTOMIZATIONS) {
        const subsectionIndex = index % subsectionIds.length;
        const subsectionId    = subsectionIds[subsectionIndex];

        await pool.execute<ResultSetHeader>(
          `INSERT INTO \`customization\` 
            (\`name\`, \`description\`, \`subsection_id\`, \`company_id\`) 
           VALUES (?, ?, ?, ?)`,
          [customization.name, customization.description, subsectionId, company.id]
        );
        customizationCount++;
        index++;
      }
    }

    console.log(`Created ${customizationCount} customizations`);
    console.log('Seeding completed successfully!');

  } catch (error: unknown) {
    console.error('Error seeding customizations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();