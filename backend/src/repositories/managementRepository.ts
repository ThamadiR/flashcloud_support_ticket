import pool from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface UserRow extends RowDataPacket {
  id:       number;
  username: string;
  email:    string;
  role:     string;
}

interface CompanyRow extends RowDataPacket {
  id:          number;
  name:        string;
  description: string;
  email:       string;
  created_at:  Date;
}

interface ServerRow extends RowDataPacket {
  id:           number;
  companyId:    number;
  ipAddress:    string;
  label:        string;
  createdAt:    Date;
  company_id:   number;
  company_name: string;
}

interface TenantRow extends RowDataPacket {
  id:           number;
  companyId:    number;
  name:         string;
  description:  string;
  createdAt:    Date;
  company_id:   number;
  company_name: string;
}

interface SipConfigRow extends RowDataPacket {
  id:             number;
  tenantId:       number;
  sipCount:       number;
  sipProvider:    string;
  sipChannelCount: number;
  sipDescription: string;
  licenseCount:   number;
  createdAt:      Date;
  tenant_id:      number;
  tenant_name:    string;
}

interface SectionRow extends RowDataPacket {
  id:   number;
  name: string;
}

interface SubsectionRow extends RowDataPacket {
  id:         number;
  name:       string;
  section_id: number;
}

interface CustomizationRow extends RowDataPacket {
  id:           number;
  name:         string;
  subsection_id: number;
  company_id:   number;
  company_name: string;
}

export class ManagementRepository {

  // ─── User ────────────────────────────────────────────────────────────────

  async findRequesterById(id: number): Promise<UserRow | null> {
    const [rows] = await pool.execute<UserRow[]>(
      'SELECT `userId` AS id, `userName` AS username, `Email` AS email, `role` FROM `Management` WHERE `userId` = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async updateUserRole(id: number, role: string): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE `Management` SET `role` = ? WHERE `userId` = ?',
      [role, id]
    );
  }

  // ─── Companies ───────────────────────────────────────────────────────────

  async listCompanies(): Promise<CompanyRow[]> {
    const [rows] = await pool.execute<CompanyRow[]>(
      'SELECT * FROM `companyList` ORDER BY `id` DESC'
    );
    return rows;
  }

  async createCompany(data: Partial<CompanyRow>): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'INSERT INTO `companyList` (`name`, `description`, `email`) VALUES (?, ?, ?)',
      [data.name, data.description, data.email]
    );
  }

  async updateCompany(id: number, data: Partial<CompanyRow>): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE `companyList` SET `name` = ?, `description` = ?, `email` = ? WHERE `id` = ?',
      [data.name, data.description, data.email, id]
    );
  }

  async deleteCompany(id: number): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM `companyList` WHERE `id` = ?',
      [id]
    );
  }

  async findCompanyById(companyId: number): Promise<Pick<CompanyRow, 'id' | 'name'> | null> {
    const [rows] = await pool.execute<CompanyRow[]>(
      'SELECT `id`, `name` FROM `companyList` WHERE `id` = ?',
      [companyId]
    );
    return rows[0] ?? null;
  }

  // ─── Servers ─────────────────────────────────────────────────────────────

  async listServersByCompany(companyId?: number): Promise<ServerRow[]> {
    if (Number.isFinite(companyId)) {
      const [rows] = await pool.execute<ServerRow[]>(
        `SELECT
          s.id,
          s.company_id        AS companyId,
          s.ip_address        AS ipAddress,
          COALESCE(s.label, '') AS label,
          s.created_at        AS createdAt,
          c.id                AS company_id,
          c.name              AS company_name
         FROM \`servers\` s
         LEFT JOIN \`companyList\` c ON c.id = s.company_id
         WHERE s.company_id = ?
         ORDER BY s.id DESC`,
        [companyId]
      );
      return rows;
    }

    const [rows] = await pool.execute<ServerRow[]>(
      `SELECT
        s.id,
        s.company_id        AS companyId,
        s.ip_address        AS ipAddress,
        COALESCE(s.label, '') AS label,
        s.created_at        AS createdAt,
        c.id                AS company_id,
        c.name              AS company_name
       FROM \`servers\` s
       LEFT JOIN \`companyList\` c ON c.id = s.company_id
       ORDER BY s.id DESC`
    );
    return rows;
  }

  async createServer(companyId: number, ipAddress: string, label: string): Promise<ServerRow | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`servers\` (\`company_id\`, \`ip_address\`, \`label\`)
       VALUES (?, ?, NULLIF(?, ''))`,
      [companyId, ipAddress, label]
    );
    const insertId = result.insertId;
    const [rows] = await pool.execute<ServerRow[]>(
      `SELECT
        s.id,
        s.company_id        AS companyId,
        s.ip_address        AS ipAddress,
        COALESCE(s.label, '') AS label,
        s.created_at        AS createdAt,
        c.id                AS company_id,
        c.name              AS company_name
       FROM \`servers\` s
       LEFT JOIN \`companyList\` c ON c.id = s.company_id
       WHERE s.id = ?`,
      [insertId]
    );
    return rows[0] ?? null;
  }

  async updateServer(serverId: number, ipAddress: string, label: string): Promise<ServerRow | null> {
    await pool.execute<ResultSetHeader>(
      `UPDATE \`servers\`
       SET \`ip_address\` = ?, \`label\` = NULLIF(?, '')
       WHERE \`id\` = ?`,
      [ipAddress, label, serverId]
    );
    const [rows] = await pool.execute<ServerRow[]>(
      `SELECT
        s.id,
        s.company_id        AS companyId,
        s.ip_address        AS ipAddress,
        COALESCE(s.label, '') AS label,
        s.created_at        AS createdAt,
        c.id                AS company_id,
        c.name              AS company_name
       FROM \`servers\` s
       LEFT JOIN \`companyList\` c ON c.id = s.company_id
       WHERE s.id = ?`,
      [serverId]
    );
    return rows[0] ?? null;
  }

  // ─── Tenants ─────────────────────────────────────────────────────────────

  async listTenantsByCompany(companyId?: number): Promise<TenantRow[]> {
    if (Number.isFinite(companyId)) {
      const [rows] = await pool.execute<TenantRow[]>(
        `SELECT
          t.id,
          t.company_id          AS companyId,
          t.name,
          COALESCE(t.description, '') AS description,
          t.created_at          AS createdAt,
          c.id                  AS company_id,
          c.name                AS company_name
         FROM \`tenants\` t
         LEFT JOIN \`companyList\` c ON c.id = t.company_id
         WHERE t.company_id = ?
         ORDER BY t.id DESC`,
        [companyId]
      );
      return rows;
    }

    const [rows] = await pool.execute<TenantRow[]>(
      `SELECT
        t.id,
        t.company_id          AS companyId,
        t.name,
        COALESCE(t.description, '') AS description,
        t.created_at          AS createdAt,
        c.id                  AS company_id,
        c.name                AS company_name
       FROM \`tenants\` t
       LEFT JOIN \`companyList\` c ON c.id = t.company_id
       ORDER BY t.id DESC`
    );
    return rows;
  }

  async findTenantById(tenantId: number): Promise<TenantRow | null> {
    const [rows] = await pool.execute<TenantRow[]>(
      'SELECT `id`, `name` FROM `tenants` WHERE `id` = ?',
      [tenantId]
    );
    return rows[0] ?? null;
  }

  async createTenant(companyId: number, name: string, description: string): Promise<TenantRow | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`tenants\` (\`company_id\`, \`name\`, \`description\`)
       VALUES (?, ?, NULLIF(?, ''))`,
      [companyId, name, description]
    );
    const insertId = result.insertId;
    const [rows] = await pool.execute<TenantRow[]>(
      `SELECT
        t.id,
        t.company_id          AS companyId,
        t.name,
        COALESCE(t.description, '') AS description,
        t.created_at          AS createdAt,
        c.id                  AS company_id,
        c.name                AS company_name
       FROM \`tenants\` t
       LEFT JOIN \`companyList\` c ON c.id = t.company_id
       WHERE t.id = ?`,
      [insertId]
    );
    return rows[0] ?? null;
  }

  async updateTenant(tenantId: number, name: string, description: string): Promise<TenantRow | null> {
    await pool.execute<ResultSetHeader>(
      `UPDATE \`tenants\`
       SET \`name\` = ?, \`description\` = NULLIF(?, '')
       WHERE \`id\` = ?`,
      [name, description, tenantId]
    );
    const [rows] = await pool.execute<TenantRow[]>(
      `SELECT
        t.id,
        t.company_id          AS companyId,
        t.name,
        COALESCE(t.description, '') AS description,
        t.created_at          AS createdAt,
        c.id                  AS company_id,
        c.name                AS company_name
       FROM \`tenants\` t
       LEFT JOIN \`companyList\` c ON c.id = t.company_id
       WHERE t.id = ?`,
      [tenantId]
    );
    return rows[0] ?? null;
  }

  // ─── SIP Configs ─────────────────────────────────────────────────────────

  async listSipConfigsByTenant(tenantId: number): Promise<SipConfigRow[]> {
    const [rows] = await pool.execute<SipConfigRow[]>(
      `SELECT
        s.id,
        s.tenant_id         AS tenantId,
        s.sip_count         AS sipCount,
        s.sip_provider      AS sipProvider,
        s.sip_channel_count AS sipChannelCount,
        s.sip_description   AS sipDescription,
        s.license_count     AS licenseCount,
        s.created_at        AS createdAt,
        t.id                AS tenant_id,
        t.name              AS tenant_name
       FROM \`sip_configs\` s
       LEFT JOIN \`tenants\` t ON t.id = s.tenant_id
       WHERE s.tenant_id = ?
       ORDER BY s.id DESC`,
      [tenantId]
    );
    return rows;
  }

  async createSipConfig(data: any): Promise<SipConfigRow | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO \`sip_configs\`
        (\`tenant_id\`, \`sip_count\`, \`sip_provider\`, \`sip_channel_count\`, \`sip_description\`, \`license_count\`)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [data.tenantId, data.sipCount, data.sipProvider, data.sipChannelCount, data.sipDescription, data.licenseCount]
    );
    const insertId = result.insertId;
    const [rows] = await pool.execute<SipConfigRow[]>(
      `SELECT
        s.id,
        s.tenant_id         AS tenantId,
        s.sip_count         AS sipCount,
        s.sip_provider      AS sipProvider,
        s.sip_channel_count AS sipChannelCount,
        s.sip_description   AS sipDescription,
        s.license_count     AS licenseCount,
        s.created_at        AS createdAt,
        t.id                AS tenant_id,
        t.name              AS tenant_name
       FROM \`sip_configs\` s
       LEFT JOIN \`tenants\` t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [insertId]
    );
    return rows[0] ?? null;
  }

  async updateSipConfig(sipConfigId: number, data: any): Promise<SipConfigRow | null> {
    await pool.execute<ResultSetHeader>(
      `UPDATE \`sip_configs\`
       SET
        \`tenant_id\`         = ?,
        \`sip_count\`         = ?,
        \`sip_provider\`      = ?,
        \`sip_channel_count\` = ?,
        \`sip_description\`   = ?,
        \`license_count\`     = ?
       WHERE \`id\` = ?`,
      [data.tenantId, data.sipCount, data.sipProvider, data.sipChannelCount, data.sipDescription, data.licenseCount, sipConfigId]
    );
    const [rows] = await pool.execute<SipConfigRow[]>(
      `SELECT
        s.id,
        s.tenant_id         AS tenantId,
        s.sip_count         AS sipCount,
        s.sip_provider      AS sipProvider,
        s.sip_channel_count AS sipChannelCount,
        s.sip_description   AS sipDescription,
        s.license_count     AS licenseCount,
        s.created_at        AS createdAt,
        t.id                AS tenant_id,
        t.name              AS tenant_name
       FROM \`sip_configs\` s
       LEFT JOIN \`tenants\` t ON t.id = s.tenant_id
       WHERE s.id = ?`,
      [sipConfigId]
    );
    return rows[0] ?? null;
  }

  // ─── Customization Sections ───────────────────────────────────────────────

  async listCustomizationSections(): Promise<SectionRow[]> {
    const [rows] = await pool.execute<SectionRow[]>(
      'SELECT * FROM `customization_sections` ORDER BY `id` ASC'
    );
    return rows;
  }

  async findCustomizationSectionById(id: number): Promise<SectionRow | null> {
    const [rows] = await pool.execute<SectionRow[]>(
      'SELECT * FROM `customization_sections` WHERE `id` = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  // ─── Customization Subsections ────────────────────────────────────────────

  async listCustomizationSubsections(where?: Partial<SubsectionRow>): Promise<SubsectionRow[]> {
    let query = 'SELECT * FROM `customization_subsections`';
    const params: any[] = [];

    if (where?.section_id) {
      query += ' WHERE `section_id` = ?';
      params.push(where.section_id);
    }

    query += ' ORDER BY `id` DESC';
    const [rows] = await pool.execute<SubsectionRow[]>(query, params);
    return rows;
  }

  async findCustomizationSubsectionById(id: number): Promise<SubsectionRow | null> {
    const [rows] = await pool.execute<SubsectionRow[]>(
      'SELECT * FROM `customization_subsections` WHERE `id` = ?',
      [id]
    );
    return rows[0] ?? null;
  }

  async createCustomizationSubsection(data: Partial<SubsectionRow>): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'INSERT INTO `customization_subsections` (`name`, `section_id`) VALUES (?, ?)',
      [data.name, data.section_id]
    );
  }

  async updateCustomizationSubsection(id: number, data: Partial<SubsectionRow>): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'UPDATE `customization_subsections` SET `name` = ?, `section_id` = ? WHERE `id` = ?',
      [data.name, data.section_id, id]
    );
  }

  async deleteCustomizationSubsection(id: number): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM `customization_subsections` WHERE `id` = ?',
      [id]
    );
  }

  // ─── Customizations ───────────────────────────────────────────────────────

  async listCustomizations(where: Partial<CustomizationRow>): Promise<CustomizationRow[]> {
    let query = `
      SELECT
        cu.id,
        cu.name,
        cu.subsection_id,
        cu.company_id,
        c.name AS company_name
      FROM \`customization\` cu
      LEFT JOIN \`companyList\` c ON c.id = cu.company_id
      LEFT JOIN \`customization_subsections\` cs ON cs.id = cu.subsection_id
    `;
    const params: any[] = [];

    if (where?.company_id) {
      query += ' WHERE cu.company_id = ?';
      params.push(where.company_id);
    }

    query += ' ORDER BY cu.id DESC';
    const [rows] = await pool.execute<CustomizationRow[]>(query, params);
    return rows;
  }

  async createCustomization(data: Partial<CustomizationRow>): Promise<CustomizationRow | null> {
    const [result] = await pool.execute<ResultSetHeader>(
      'INSERT INTO `customization` (`name`, `subsection_id`, `company_id`) VALUES (?, ?, ?)',
      [data.name, data.subsection_id, data.company_id]
    );
    const insertId = result.insertId;
    const [rows] = await pool.execute<CustomizationRow[]>(
      `SELECT
        cu.id,
        cu.name,
        cu.subsection_id,
        cu.company_id,
        c.name AS company_name
       FROM \`customization\` cu
       LEFT JOIN \`companyList\` c ON c.id = cu.company_id
       WHERE cu.id = ?`,
      [insertId]
    );
    return rows[0] ?? null;
  }

  async updateCustomization(id: number, data: Partial<CustomizationRow>): Promise<CustomizationRow | null> {
    await pool.execute<ResultSetHeader>(
      'UPDATE `customization` SET `name` = ?, `subsection_id` = ?, `company_id` = ? WHERE `id` = ?',
      [data.name, data.subsection_id, data.company_id, id]
    );
    const [rows] = await pool.execute<CustomizationRow[]>(
      `SELECT
        cu.id,
        cu.name,
        cu.subsection_id,
        cu.company_id,
        c.name AS company_name
       FROM \`customization\` cu
       LEFT JOIN \`companyList\` c ON c.id = cu.company_id
       WHERE cu.id = ?`,
      [id]
    );
    return rows[0] ?? null;
  }

  async deleteCustomization(id: number): Promise<void> {
    await pool.execute<ResultSetHeader>(
      'DELETE FROM `customization` WHERE `id` = ?',
      [id]
    );
  }
}