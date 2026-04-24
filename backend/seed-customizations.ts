import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const SUBSECTIONS = [
  { name: 'General Settings', section: 'General' },
  { name: 'Account Settings', section: 'General' },
  { name: 'UI Customization', section: 'Appearance' },
  { name: 'Theme Settings', section: 'Appearance' },
  { name: 'Advanced Options', section: 'Advanced' },
  { name: 'Integration', section: 'Advanced' },
  { name: 'Notification Rules', section: 'Workflow' },
  { name: 'Automation', section: 'Workflow' },
  { name: 'Security', section: 'Security' },
  { name: 'API Access', section: 'Security' },
];

const SECTIONS = ['General', 'Appearance', 'Advanced', 'Workflow', 'Security'];

const CUSTOMIZATIONS = [
  { name: 'Color Scheme', description: 'Choose between light, dark, and auto themes' },
  { name: 'Font Size', description: 'Adjust the application font size' },
  { name: 'Language', description: 'Select your preferred language' },
  { name: 'Timezone', description: 'Set your timezone for date and time displays' },
  { name: 'Notification Preferences', description: 'Configure notification settings' },
  { name: 'Data Export Format', description: 'Choose default format for data exports' },
  { name: 'API Key Management', description: 'Generate and manage API keys' },
  { name: 'Authentication Method', description: 'Configure preferred authentication methods' },
  { name: 'Dashboard Layout', description: 'Customize dashboard widget arrangement' },
  { name: 'Default Currency', description: 'Set the default currency for transactions' },
];

async function main(): Promise<void> {
  try {
    console.log('Seeding customization subsections...');

    // Clear existing data
    await prisma.customization.deleteMany({});
    await prisma.customizationSubsection.deleteMany({});
    await prisma.customizationSection.deleteMany({});

    const sections = await Promise.all(
      SECTIONS.map((name) =>
        prisma.customizationSection.create({
          data: { name },
        })
      )
    );

    const sectionByName = new Map(sections.map((section) => [section.name, section]));

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        id: 'asc',
      },
    });

    if (companies.length === 0) {
      throw new Error('No companies found for customization seeding');
    }

    // Seed subsections
    const subsections = await Promise.all(
      SUBSECTIONS.map((subsection) =>
        prisma.customizationSubsection.create({
          data: {
            name: subsection.name,
            sectionId: sectionByName.get(subsection.section)?.id ?? null,
          },
        })
      )
    );

    console.log(`Created ${subsections.length} subsections`);

    // Seed customizations for each company so the UI can scope the list correctly
    const customizations = await Promise.all(
      companies.flatMap((company) =>
        CUSTOMIZATIONS.map((customization, index) => {
          const subsectionIndex = index % subsections.length;
          const subsection = subsections[subsectionIndex];
          return prisma.customization.create({
            data: {
              name: customization.name,
              description: customization.description,
              subsectionId: subsection.id,
              companyId: company.id,
            },
          });
        })
      )
    );

    console.log(`Created ${customizations.length} customizations`);
    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding customizations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
