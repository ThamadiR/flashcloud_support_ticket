export class ManagementRepository {
  constructor(
    private readonly prisma: any,
    private readonly pool: any,
  ) {}

  findRequesterById(id: number) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }

  updateUserRole(id: number, role: string) {
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
    });
  }

  listCompanies() {
    return this.prisma.company.findMany({ orderBy: { id: 'desc' } });
  }

  createCompany(data: any) {
    return this.prisma.company.create({ data });
  }

  updateCompany(id: number, data: any) {
    return this.prisma.company.update({ where: { id }, data });
  }

  deleteCompany(id: number) {
    return this.prisma.company.delete({ where: { id } });
  }

  listServersByCompany(companyId?: number) {
    const queryText = Number.isFinite(companyId)
      ? `
          SELECT
            s.id,
            s.company_id AS "companyId",
            s.ip_address::text AS "ipAddress",
            COALESCE(s.label, '') AS label,
            s.created_at AS "createdAt",
            c.id AS "company_id",
            c.name AS "company_name"
          FROM servers s
          LEFT JOIN "companyList" c ON c.id = s.company_id
          WHERE s.company_id = $1
          ORDER BY s.id DESC
        `
      : `
          SELECT
            s.id,
            s.company_id AS "companyId",
            s.ip_address::text AS "ipAddress",
            COALESCE(s.label, '') AS label,
            s.created_at AS "createdAt",
            c.id AS "company_id",
            c.name AS "company_name"
          FROM servers s
          LEFT JOIN "companyList" c ON c.id = s.company_id
          ORDER BY s.id DESC
        `;

    const queryParams = Number.isFinite(companyId) ? [companyId] : [];
    return this.pool.query(queryText, queryParams);
  }

  createServer(companyId: number, ipAddress: string, label: string) {
    return this.pool.query(
      `
        WITH inserted AS (
          INSERT INTO servers (company_id, ip_address, label)
          VALUES ($1, $2::inet, NULLIF($3, ''))
          RETURNING id, company_id, ip_address::text AS ip_address, label, created_at
        )
        SELECT
          i.id,
          i.company_id AS "companyId",
          i.ip_address AS "ipAddress",
          COALESCE(i.label, '') AS label,
          i.created_at AS "createdAt",
          c.id AS "company_id",
          c.name AS "company_name"
        FROM inserted i
        LEFT JOIN "companyList" c ON c.id = i.company_id
      `,
      [companyId, ipAddress, label]
    );
  }

  updateServer(serverId: number, ipAddress: string, label: string) {
    return this.pool.query(
      `
        WITH updated AS (
          UPDATE servers
          SET ip_address = $1::inet,
              label = NULLIF($2, '')
          WHERE id = $3
          RETURNING id, company_id, ip_address::text AS ip_address, label, created_at
        )
        SELECT
          u.id,
          u.company_id AS "companyId",
          u.ip_address AS "ipAddress",
          COALESCE(u.label, '') AS label,
          u.created_at AS "createdAt",
          c.id AS "company_id",
          c.name AS "company_name"
        FROM updated u
        LEFT JOIN "companyList" c ON c.id = u.company_id
      `,
      [ipAddress, label, serverId]
    );
  }

  listTenantsByCompany(companyId?: number) {
    const queryText = Number.isFinite(companyId)
      ? `
          SELECT
            t.id,
            t.company_id AS "companyId",
            t.name,
            COALESCE(t.description, '') AS description,
            t.created_at AS "createdAt",
            c.id AS "company_id",
            c.name AS "company_name"
          FROM tenants t
          LEFT JOIN "companyList" c ON c.id = t.company_id
          WHERE t.company_id = $1
          ORDER BY t.id DESC
        `
      : `
          SELECT
            t.id,
            t.company_id AS "companyId",
            t.name,
            COALESCE(t.description, '') AS description,
            t.created_at AS "createdAt",
            c.id AS "company_id",
            c.name AS "company_name"
          FROM tenants t
          LEFT JOIN "companyList" c ON c.id = t.company_id
          ORDER BY t.id DESC
        `;

    const queryParams = Number.isFinite(companyId) ? [companyId] : [];
    return this.pool.query(queryText, queryParams);
  }

  createTenant(companyId: number, name: string, description: string) {
    return this.pool.query(
      `
        WITH inserted AS (
          INSERT INTO tenants (company_id, name, description)
          VALUES ($1, $2, NULLIF($3, ''))
          RETURNING id, company_id, name, description, created_at
        )
        SELECT
          i.id,
          i.company_id AS "companyId",
          i.name,
          COALESCE(i.description, '') AS description,
          i.created_at AS "createdAt",
          c.id AS "company_id",
          c.name AS "company_name"
        FROM inserted i
        LEFT JOIN "companyList" c ON c.id = i.company_id
      `,
      [companyId, name, description]
    );
  }

  updateTenant(tenantId: number, name: string, description: string) {
    return this.pool.query(
      `
        WITH updated AS (
          UPDATE tenants
          SET name = $1,
              description = NULLIF($2, '')
          WHERE id = $3
          RETURNING id, company_id, name, description, created_at
        )
        SELECT
          u.id,
          u.company_id AS "companyId",
          u.name,
          COALESCE(u.description, '') AS description,
          u.created_at AS "createdAt",
          c.id AS "company_id",
          c.name AS "company_name"
        FROM updated u
        LEFT JOIN "companyList" c ON c.id = u.company_id
      `,
      [name, description, tenantId]
    );
  }

  listSipConfigsByTenant(tenantId: number) {
    return this.pool.query(
      `
        SELECT
          s.id,
          s.tenant_id AS "tenantId",
          s.sip_count AS "sipCount",
          s.sip_provider AS "sipProvider",
          s.sip_channel_count AS "sipChannelCount",
          s.sip_description AS "sipDescription",
          s.license_count AS "licenseCount",
          s.created_at AS "createdAt",
          t.id AS "tenant_id",
          t.name AS "tenant_name"
        FROM sip_configs s
        LEFT JOIN tenants t ON t.id = s.tenant_id
        WHERE s.tenant_id = $1
        ORDER BY s.id DESC
      `,
      [tenantId]
    );
  }

  findTenantById(tenantId: number) {
    return this.pool.query('SELECT id, name FROM tenants WHERE id = $1', [tenantId]);
  }

  createSipConfig(data: any) {
    return this.pool.query(
      `
        WITH inserted AS (
          INSERT INTO sip_configs (
            tenant_id,
            sip_count,
            sip_provider,
            sip_channel_count,
            sip_description,
            license_count
          ) VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING id, tenant_id, sip_count, sip_provider, sip_channel_count, sip_description, license_count, created_at
        )
        SELECT
          i.id,
          i.tenant_id AS "tenantId",
          i.sip_count AS "sipCount",
          i.sip_provider AS "sipProvider",
          i.sip_channel_count AS "sipChannelCount",
          i.sip_description AS "sipDescription",
          i.license_count AS "licenseCount",
          i.created_at AS "createdAt",
          t.id AS "tenant_id",
          t.name AS "tenant_name"
        FROM inserted i
        LEFT JOIN tenants t ON t.id = i.tenant_id
      `,
      [
        data.tenantId,
        data.sipCount,
        data.sipProvider,
        data.sipChannelCount,
        data.sipDescription,
        data.licenseCount,
      ]
    );
  }

  updateSipConfig(sipConfigId: number, data: any) {
    return this.pool.query(
      `
        WITH updated AS (
          UPDATE sip_configs
          SET
            tenant_id = $2,
            sip_count = $3,
            sip_provider = $4,
            sip_channel_count = $5,
            sip_description = $6,
            license_count = $7
          WHERE id = $1
          RETURNING id, tenant_id, sip_count, sip_provider, sip_channel_count, sip_description, license_count, created_at
        )
        SELECT
          u.id,
          u.tenant_id AS "tenantId",
          u.sip_count AS "sipCount",
          u.sip_provider AS "sipProvider",
          u.sip_channel_count AS "sipChannelCount",
          u.sip_description AS "sipDescription",
          u.license_count AS "licenseCount",
          u.created_at AS "createdAt",
          t.id AS "tenant_id",
          t.name AS "tenant_name"
        FROM updated u
        LEFT JOIN tenants t ON t.id = u.tenant_id
      `,
      [
        sipConfigId,
        data.tenantId,
        data.sipCount,
        data.sipProvider,
        data.sipChannelCount,
        data.sipDescription,
        data.licenseCount,
      ]
    );
  }

  listCustomizationSubsections(where?: any) {
    return this.prisma.customizationSubsection.findMany({ where, orderBy: { id: 'desc' } });
  }

  listCustomizationSections() {
    return this.prisma.customizationSection.findMany({ orderBy: { id: 'asc' } });
  }

  findCompanyById(companyId: number) {
    return this.prisma.company.findUnique({ where: { id: companyId }, select: { id: true, name: true } });
  }

  findCustomizationSectionById(id: number) {
    return this.prisma.customizationSection.findUnique({ where: { id } });
  }

  findCustomizationSubsectionById(id: number) {
    return this.prisma.customizationSubsection.findUnique({ where: { id } });
  }

  createCustomizationSubsection(data: any) {
    return this.prisma.customizationSubsection.create({ data });
  }

  updateCustomizationSubsection(id: number, data: any) {
    return this.prisma.customizationSubsection.update({ where: { id }, data });
  }

  deleteCustomizationSubsection(id: number) {
    return this.prisma.customizationSubsection.delete({ where: { id } });
  }

  listCustomizations(where: any) {
    return this.prisma.customization.findMany({
      where,
      include: {
        subsection: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { id: 'desc' },
    });
  }

  createCustomization(data: any) {
    return this.prisma.customization.create({
      data,
      include: {
        subsection: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  updateCustomization(id: number, data: any) {
    return this.prisma.customization.update({
      where: { id },
      data,
      include: {
        subsection: true,
        company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  deleteCustomization(id: number) {
    return this.prisma.customization.delete({ where: { id } });
  }
}
