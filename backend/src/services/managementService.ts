import { ApiError } from './apiError';
import { ManagementRepository } from '../repositories/managementRepository';
import { normalizeUserRole, resolveStoredRole, USER_ROLES } from './userHelpers';

const normalizeCompanyPayload = (company: any) => ({
  id: company.id,
  name: company.name,
  description: company.description || '',
  email: company.email || '',
  tenantCount: Number(company.tenantCount || 0),
  createdAt: company.createdAt,
  updatedAt: company.updatedAt,
});

const normalizeCustomizationSubsectionPayload = (subsection: any) => ({
  id: subsection.id,
  sectionId: subsection.sectionId ?? subsection.section_id ?? null,
  name: subsection.name,
});

const normalizeCustomizationSectionPayload = (section: any) => ({
  id: section.id,
  name: section.name,
});

const normalizeCustomizationPayload = (customization: any) => {
  const companyId = customization.companyId ?? customization.company_id ?? null;
  const subsectionId = customization.subsectionId ?? customization.subsection_id ?? null;
  const companyName = customization.company_name ?? (customization.company ? customization.company.name : '');
  const subsectionName = customization.subsection_name ?? (customization.subsection ? customization.subsection.name : '');
  // Use raw DB value (snake_case created_at) exactly as stored
  const createdAt = customization.created_at ?? customization.createdAt ?? null;

  return {
    id: customization.id,
    subsectionId,
    companyId,
    name: customization.name,
    description: customization.description || '',
    createdAt,
    company: companyId
      ? {
          id: companyId,
          name: companyName,
        }
      : null,
    subsection: subsectionId
      ? {
          id: subsectionId,
          name: subsectionName,
          sectionId: customization.section_id ?? (customization.subsection ? customization.subsection.sectionId : null)
        }
      : null,
  };
};

const normalizeSipConfigRow = (row: any) => ({
  id: Number(row.id),
  tenantId: Number(row.tenantId),
  sipCount: row.sipCount === null || row.sipCount === undefined ? null : Number(row.sipCount),
  sipProvider: String(row.sipProvider || ''),
  sipChannelCount: row.sipChannelCount === null || row.sipChannelCount === undefined ? null : Number(row.sipChannelCount),
  sipDescription: String(row.sipDescription || ''),
  licenseCount: row.licenseCount === null || row.licenseCount === undefined ? null : Number(row.licenseCount),
  createdAt: row.createdAt,
  tenant: row.tenant_id
    ? {
        id: Number(row.tenant_id),
        name: String(row.tenant_name || ''),
      }
    : null,
});

const normalizeServerRow = (row: any) => ({
  id: Number(row.id),
  companyId: Number(row.companyId),
  ipAddress: String(row.ipAddress || ''),
  label: String(row.label || ''),
  createdAt: row.createdAt,
  company: row.company_id
    ? {
        id: Number(row.company_id),
        name: String(row.company_name || ''),
      }
    : null,
});

const normalizeTenantRow = (row: any) => ({
  id: Number(row.id),
  companyId: Number(row.companyId),
  name: String(row.name || ''),
  description: String(row.description || ''),
  createdAt: row.createdAt,
  company: row.company_id
    ? {
        id: Number(row.company_id),
        name: String(row.company_name || ''),
      }
    : null,
});

export class ManagementService {
  constructor(private readonly repository: ManagementRepository) {}

  private async getRequesterUser(requesterIdRaw: unknown) {
    const requesterId = Number(requesterIdRaw);
    if (!Number.isFinite(requesterId)) {
      throw new ApiError(401, 'Unauthorized: Invalid token payload');
    }

    const requester = await this.repository.findRequesterById(requesterId);
    if (!requester) {
      throw new ApiError(401, 'Unauthorized: User not found');
    }

    const requesterRole = resolveStoredRole(requester);
    if (normalizeUserRole(requester.role) !== requesterRole) {
      await this.repository.updateUserRole(requester.id, requesterRole);
    }

    return {
      ...requester,
      role: requesterRole,
    };
  }

  private async requireAdmin(requesterIdRaw: unknown, errorMessage: string) {
    const requester = await this.getRequesterUser(requesterIdRaw);
    const requesterIsAdmin = normalizeUserRole(requester.role) === USER_ROLES.ADMIN;
    if (!requesterIsAdmin) {
      throw new ApiError(403, errorMessage);
    }
    return requester;
  }

  async listCompanies(requesterIdRaw: unknown) {
    await this.getRequesterUser(requesterIdRaw);
    const companiesRaw = await this.repository.listCompanies();
    return { companies: companiesRaw.map(normalizeCompanyPayload) };
  }

  async createCompany(requesterIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can add companies');

    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();
    const email = String(payload?.email || '').trim();
    const tenantCountInput = Number(payload?.tenantCount ?? 0);

    if (!name) {
      throw new ApiError(400, 'Company name is required');
    }

    if (!description) {
      throw new ApiError(400, 'Company description is required');
    }

    if (!email) {
      throw new ApiError(400, 'Company email is required');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    const tenantCount = Number.isFinite(tenantCountInput) && tenantCountInput >= 0 ? Math.floor(tenantCountInput) : 0;
    if (tenantCount === 0 || !Number.isFinite(tenantCountInput) || tenantCountInput < 0) {
      throw new ApiError(400, 'Tenant count must be a positive number');
    }

    const companyRaw = await this.repository.createCompany({ name, description, email, tenantCount });
    return {
      message: 'Company created successfully',
      company: normalizeCompanyPayload(companyRaw),
    };
  }

  async updateCompany(requesterIdRaw: unknown, companyIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can edit companies');

    const companyId = parseInt(String(companyIdRaw), 10);
    if (!Number.isFinite(companyId)) {
      throw new ApiError(400, 'Invalid company id');
    }

    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();
    const email = String(payload?.email || '').trim();
    const tenantCountInput = Number(payload?.tenantCount ?? 0);

    if (!name) throw new ApiError(400, 'Company name is required');
    if (!description) throw new ApiError(400, 'Company description is required');
    if (!email) throw new ApiError(400, 'Company email is required');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    const tenantCount = Number.isFinite(tenantCountInput) && tenantCountInput >= 0 ? Math.floor(tenantCountInput) : 0;
    if (tenantCount === 0 || !Number.isFinite(tenantCountInput) || tenantCountInput < 0) {
      throw new ApiError(400, 'Tenant count must be a positive number');
    }

    try {
      const companyRaw = await this.repository.updateCompany(companyId, {
        name,
        description,
        email,
        tenantCount,
        updatedAt: new Date(),
      });

      return {
        message: 'Company updated successfully',
        company: normalizeCompanyPayload(companyRaw),
      };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Company not found');
      }
      throw error;
    }
  }

  async deleteCompany(requesterIdRaw: unknown, companyIdRaw: unknown) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can delete companies');

    const companyId = parseInt(String(companyIdRaw), 10);
    if (!Number.isFinite(companyId)) {
      throw new ApiError(400, 'Invalid company id');
    }

    try {
      await this.repository.deleteCompany(companyId);
      return { message: 'Company deleted successfully' };
    } catch (error: any) {
      if (error?.code === 'P2025') {
        throw new ApiError(404, 'Company not found');
      }
      throw error;
    }
  }

  async listServers(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const companyIdRaw = String(query?.companyId || '').trim();
    const companyId = companyIdRaw ? parseInt(companyIdRaw, 10) : NaN;
    const hasCompanyFilter = Number.isFinite(companyId);

    const queryResult = await this.repository.listServersByCompany(hasCompanyFilter ? companyId : undefined);
    return { servers: queryResult.map(normalizeServerRow) };
  }

  async createServer(requesterIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const companyId = Number(payload?.companyId);
    const ipAddress = String(payload?.ipAddress || '').trim();
    const label = String(payload?.label || '').trim();

    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ApiError(400, 'Valid company id is required');
    }
    if (!ipAddress) {
      throw new ApiError(400, 'IP address is required');
    }

    try {
      const queryResult = await this.repository.createServer(companyId, ipAddress, label);
      return {
        message: 'Server created successfully',
        server: normalizeServerRow(queryResult),
      };
    } catch (error: any) {
      if (error?.code === '22P02') throw new ApiError(400, 'Invalid IP address format');
      if (error?.code === '23503') throw new ApiError(400, 'Company does not exist for this company id');
      throw error;
    }
  }

  async updateServer(requesterIdRaw: unknown, serverIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const serverId = parseInt(String(serverIdRaw), 10);
    if (!Number.isFinite(serverId)) {
      throw new ApiError(400, 'Invalid server id');
    }

    const ipAddress = String(payload?.ipAddress || '').trim();
    const label = String(payload?.label || '').trim();

    if (!ipAddress) {
      throw new ApiError(400, 'IP address is required');
    }

    try {
      const queryResult = await this.repository.updateServer(serverId, ipAddress, label);
      if (!queryResult) {
        throw new ApiError(404, 'Server not found');
      }

      return {
        message: 'Server updated successfully',
        server: normalizeServerRow(queryResult),
      };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error?.code === '22P02') throw new ApiError(400, 'Invalid IP address format');
      throw error;
    }
  }

  async listTenants(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const companyIdRaw = String(query?.companyId || '').trim();
    const companyId = companyIdRaw ? parseInt(companyIdRaw, 10) : NaN;
    const hasCompanyFilter = Number.isFinite(companyId);

    const queryResult = await this.repository.listTenantsByCompany(hasCompanyFilter ? companyId : undefined);
    return { tenants: queryResult.map(normalizeTenantRow) };
  }

  async createTenant(requesterIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const companyId = Number(payload?.companyId);
    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();

    if (!Number.isFinite(companyId) || companyId <= 0) {
      throw new ApiError(400, 'Valid company id is required');
    }

    if (!name) {
      throw new ApiError(400, 'Tenant name is required');
    }

    try {
      const queryResult = await this.repository.createTenant(companyId, name, description);
      return {
        message: 'Tenant created successfully',
        tenant: normalizeTenantRow(queryResult),
      };
    } catch (error: any) {
      if (error?.code === '23503') {
        throw new ApiError(400, 'Company does not exist for this company id');
      }
      throw error;
    }
  }

  async updateTenant(requesterIdRaw: unknown, tenantIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const tenantId = parseInt(String(tenantIdRaw), 10);
    if (!Number.isFinite(tenantId)) {
      throw new ApiError(400, 'Invalid tenant id');
    }

    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();

    if (!name) {
      throw new ApiError(400, 'Tenant name is required');
    }

    const queryResult = await this.repository.updateTenant(tenantId, name, description);
    if (!queryResult) {
      throw new ApiError(404, 'Tenant not found');
    }

    return {
      message: 'Tenant updated successfully',
      tenant: normalizeTenantRow(queryResult),
    };
  }

  async listSipConfigs(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const tenantIdRaw = String(query?.tenantId || '').trim();
    const tenantId = tenantIdRaw ? parseInt(tenantIdRaw, 10) : NaN;

    if (!tenantIdRaw || !Number.isFinite(tenantId) || tenantId <= 0) {
      throw new ApiError(400, 'Tenant id filter is required');
    }

    const queryResult = await this.repository.listSipConfigsByTenant(tenantId);
    return { sipConfigs: queryResult.map(normalizeSipConfigRow) };
  }

  async createSipConfig(requesterIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const tenantId = Number(payload?.tenantId);
    const sipCountRaw = payload?.sipCount;
    const sipChannelCountRaw = payload?.sipChannelCount;
    const licenseCountRaw = payload?.licenseCount;
    const sipProvider = String(payload?.sipProvider || '').trim();
    const sipDescription = String(payload?.sipDescription || '').trim();
    const sipCount = sipCountRaw === null || sipCountRaw === undefined || String(sipCountRaw).trim() === '' ? null : Number(sipCountRaw);
    const sipChannelCount = sipChannelCountRaw === null || sipChannelCountRaw === undefined || String(sipChannelCountRaw).trim() === '' ? null : Number(sipChannelCountRaw);
    const licenseCount = licenseCountRaw === null || licenseCountRaw === undefined || String(licenseCountRaw).trim() === '' ? null : Number(licenseCountRaw);

    if (!Number.isFinite(tenantId) || tenantId <= 0) throw new ApiError(400, 'Valid tenant id is required');
    if (!sipProvider) throw new ApiError(400, 'SIP provider is required');
    if (sipCount !== null && (!Number.isFinite(sipCount) || sipCount < 0)) throw new ApiError(400, 'Invalid SIP count');
    if (sipChannelCount !== null && (!Number.isFinite(sipChannelCount) || sipChannelCount < 0)) throw new ApiError(400, 'Invalid channel count');
    if (licenseCount !== null && (!Number.isFinite(licenseCount) || licenseCount < 0)) throw new ApiError(400, 'Invalid license count');

    const tenant = await this.repository.findTenantById(tenantId);
    if (!tenant) {
      throw new ApiError(404, 'Tenant not found');
    }

    const queryResult = await this.repository.createSipConfig({
      tenantId,
      sipCount,
      sipProvider,
      sipChannelCount,
      sipDescription: sipDescription || null,
      licenseCount,
    });

    return { sipConfig: normalizeSipConfigRow(queryResult) };
  }

  async updateSipConfig(requesterIdRaw: unknown, sipConfigIdRaw: unknown, payload: any) {
    await this.getRequesterUser(requesterIdRaw);

    const sipConfigId = parseInt(String(sipConfigIdRaw), 10);
    if (!Number.isFinite(sipConfigId)) {
      throw new ApiError(400, 'Invalid sip config id');
    }

    const tenantId = Number(payload?.tenantId);
    const sipCountRaw = payload?.sipCount;
    const sipChannelCountRaw = payload?.sipChannelCount;
    const licenseCountRaw = payload?.licenseCount;
    const sipProvider = String(payload?.sipProvider || '').trim();
    const sipDescription = String(payload?.sipDescription || '').trim();
    const sipCount = sipCountRaw === null || sipCountRaw === undefined || String(sipCountRaw).trim() === '' ? null : Number(sipCountRaw);
    const sipChannelCount = sipChannelCountRaw === null || sipChannelCountRaw === undefined || String(sipChannelCountRaw).trim() === '' ? null : Number(sipChannelCountRaw);
    const licenseCount = licenseCountRaw === null || licenseCountRaw === undefined || String(licenseCountRaw).trim() === '' ? null : Number(licenseCountRaw);

    if (!Number.isFinite(tenantId) || tenantId <= 0) throw new ApiError(400, 'Valid tenant id is required');
    if (!sipProvider) throw new ApiError(400, 'SIP provider is required');
    if (sipCount !== null && (!Number.isFinite(sipCount) || sipCount < 0)) throw new ApiError(400, 'Invalid SIP count');
    if (sipChannelCount !== null && (!Number.isFinite(sipChannelCount) || sipChannelCount < 0)) throw new ApiError(400, 'Invalid channel count');
    if (licenseCount !== null && (!Number.isFinite(licenseCount) || licenseCount < 0)) throw new ApiError(400, 'Invalid license count');

    const queryResult = await this.repository.updateSipConfig(sipConfigId, {
      tenantId,
      sipCount,
      sipProvider,
      sipChannelCount,
      sipDescription: sipDescription || null,
      licenseCount,
    });

    if (!queryResult) {
      throw new ApiError(404, 'Sip config not found');
    }

    return { sipConfig: normalizeSipConfigRow(queryResult) };
  }

  async listCustomizationSubsections(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const sectionIdRaw = String(query?.sectionId || '').trim();
    const hasSectionFilter = sectionIdRaw.length > 0;
    const sectionId = hasSectionFilter ? Number(sectionIdRaw) : null;

    if (hasSectionFilter && (!Number.isFinite(sectionId) || (sectionId as number) <= 0)) {
      throw new ApiError(400, 'Invalid section id filter');
    }

    const where = hasSectionFilter ? { section_id: sectionId as number } : undefined;
    const subsectionsRaw = await this.repository.listCustomizationSubsections(where);

    return {
      subsections: subsectionsRaw.map(normalizeCustomizationSubsectionPayload),
    };
  }

  async listCustomizationSections(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const companyIdRaw = String(query?.companyId || '').trim();
    const companyId = companyIdRaw ? Number(companyIdRaw) : NaN;

    if (!companyIdRaw || !Number.isFinite(companyId) || companyId <= 0) {
      throw new ApiError(400, 'Valid company id filter is required');
    }

    const company = await this.repository.findCompanyById(companyId);
    if (!company) {
      throw new ApiError(404, 'Company not found');
    }

    const sectionsRaw = await this.repository.listCustomizationSections();
    return {
      sections: sectionsRaw.map(normalizeCustomizationSectionPayload),
    };
  }

  async createCustomizationSubsection(requesterIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can add customization subsections');

    const name = String(payload?.name || '').trim();
    const sectionIdRaw = String(payload?.sectionId || '').trim();
    const hasSectionId = sectionIdRaw.length > 0;
    const parsedSectionId = hasSectionId ? Number(sectionIdRaw) : null;

    if (!name) throw new ApiError(400, 'Subsection name is required');
    if (hasSectionId && (!Number.isFinite(parsedSectionId) || (parsedSectionId as number) <= 0)) {
      throw new ApiError(400, 'Valid section id is required');
    }

    
    const sectionId = hasSectionId ? (parsedSectionId as number) : null;
if (hasSectionId) {
  if (sectionId === null) throw new ApiError(400, 'Valid section id is required'); // ✅ add this line
  
  const section = await this.repository.findCustomizationSectionById(sectionId); // ✅ now number
  if (!section) throw new ApiError(404, 'Customization section not found');
}

    const subsectionRaw = await this.repository.createCustomizationSubsection({ name, sectionId });
    return {
      message: 'Customization subsection created successfully',
      subsection: normalizeCustomizationSubsectionPayload(subsectionRaw),
    };
  }

  async updateCustomizationSubsection(requesterIdRaw: unknown, subsectionIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can edit customization subsections');

    const subsectionId = parseInt(String(subsectionIdRaw), 10);
    if (!Number.isFinite(subsectionId)) throw new ApiError(400, 'Invalid subsection id');

    const name = String(payload?.name || '').trim();
    const sectionIdRaw = String(payload?.sectionId || '').trim();
    const hasSectionId = sectionIdRaw.length > 0;
    const parsedSectionId = hasSectionId ? Number(sectionIdRaw) : null;

    if (!name) throw new ApiError(400, 'Subsection name is required');
    if (hasSectionId && (!Number.isFinite(parsedSectionId) || (parsedSectionId as number) <= 0)) {
      throw new ApiError(400, 'Valid section id is required');
    }

    const sectionId = hasSectionId ? (parsedSectionId as number) : null;
if (hasSectionId) {
  if (sectionId === null) throw new ApiError(400, 'Valid section id is required'); // ✅ add this line
  
  const section = await this.repository.findCustomizationSectionById(sectionId); // ✅ now number
  if (!section) throw new ApiError(404, 'Customization section not found');
}

    try {
      const subsectionRaw = await this.repository.updateCustomizationSubsection(subsectionId, { name, sectionId });
      return {
        message: 'Customization subsection updated successfully',
        subsection: normalizeCustomizationSubsectionPayload(subsectionRaw),
      };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new ApiError(404, 'Customization subsection not found');
      throw error;
    }
  }

  async deleteCustomizationSubsection(requesterIdRaw: unknown, subsectionIdRaw: unknown) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can delete customization subsections');

    const subsectionId = parseInt(String(subsectionIdRaw), 10);
    if (!Number.isFinite(subsectionId)) throw new ApiError(400, 'Invalid subsection id');

    try {
      await this.repository.deleteCustomizationSubsection(subsectionId);
      return { message: 'Customization subsection deleted successfully' };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new ApiError(404, 'Customization subsection not found');
      throw error;
    }
  }

  async listCustomizations(requesterIdRaw: unknown, query: any) {
    await this.getRequesterUser(requesterIdRaw);

    const search = String(query?.search || '').trim();
    const companyIdRaw = String(query?.companyId || '').trim();
    const companyId = companyIdRaw ? parseInt(companyIdRaw, 10) : NaN;
    const subsectionIdRaw = String(query?.subsectionId || '').trim();
    const subsectionId = Number(subsectionIdRaw);

    if (!companyIdRaw) throw new ApiError(400, 'Company id filter is required');
    if (!Number.isFinite(companyId) || companyId <= 0) throw new ApiError(400, 'Invalid company id filter');

    const filters: any[] = [{ companyId }];

    if (search) {
      filters.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      });
    }

    if (subsectionIdRaw) {
      if (!Number.isFinite(subsectionId) || subsectionId <= 0) {
        throw new ApiError(400, 'Invalid subsection id filter');
      }
      filters.push({ subsectionId });
    }

    const customizationsRaw = await this.repository.listCustomizations({
      company_id: companyId,
      subsection_id: Number.isFinite(subsectionId) && subsectionId > 0 ? subsectionId : undefined,
      search: search || undefined,
    });
    return { customizations: customizationsRaw.map(normalizeCustomizationPayload) };
  }

  async createCustomization(requesterIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can add customizations');

    const companyId = Number(payload?.companyId);
    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();
    const sectionIdRaw = payload?.sectionId;
    const hasSectionId = sectionIdRaw !== undefined && sectionIdRaw !== null && String(sectionIdRaw).trim() !== '';
    const sectionId = Number(sectionIdRaw);
    const subsectionIdRaw = payload?.subsectionId;
    const hasSubsectionId = subsectionIdRaw !== undefined && subsectionIdRaw !== null && String(subsectionIdRaw).trim() !== '';
    const subsectionId = Number(subsectionIdRaw);

    if (!name) throw new ApiError(400, 'Customization name is required');
    if (hasSectionId && (!Number.isFinite(sectionId) || sectionId <= 0)) throw new ApiError(400, 'Invalid section id');
    if (hasSubsectionId && (!Number.isFinite(subsectionId) || subsectionId <= 0)) throw new ApiError(400, 'Invalid subsection id');

    if (hasSectionId) {
      const section = await this.repository.findCustomizationSectionById(sectionId);
      if (!section) throw new ApiError(404, 'Customization section not found');
    }

    if (hasSubsectionId) {
      const subsection = await this.repository.findCustomizationSubsectionById(subsectionId);
      if (!subsection) throw new ApiError(404, 'Customization subsection not found');
      if (hasSectionId && subsection.sectionId !== sectionId) {
        throw new ApiError(400, 'Selected subsection does not belong to selected section');
      }
    }

    const company = await this.repository.findCompanyById(companyId);
    if (!company) throw new ApiError(404, 'Company not found');

    const customizationRaw = await this.repository.createCustomization({
      companyId,
      name,
      description: description || null,
      subsectionId: hasSubsectionId ? (subsectionId as number) : null,
    });

    return {
      message: 'Customization created successfully',
      customization: normalizeCustomizationPayload(customizationRaw),
    };
  }

  async updateCustomization(requesterIdRaw: unknown, customizationIdRaw: unknown, payload: any) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can edit customizations');

    const customizationId = parseInt(String(customizationIdRaw), 10);
    if (!Number.isFinite(customizationId)) throw new ApiError(400, 'Invalid customization id');

    const name = String(payload?.name || '').trim();
    const description = String(payload?.description || '').trim();
    const sectionIdRaw = payload?.sectionId;
    const hasSectionId = sectionIdRaw !== undefined && sectionIdRaw !== null && String(sectionIdRaw).trim() !== '';
    const sectionId = Number(sectionIdRaw);
    const subsectionIdRaw = payload?.subsectionId;
    const hasSubsectionId = subsectionIdRaw !== undefined && subsectionIdRaw !== null && String(subsectionIdRaw).trim() !== '';
    const subsectionId = Number(subsectionIdRaw);

    if (!name) throw new ApiError(400, 'Customization name is required');
    if (hasSectionId && (!Number.isFinite(sectionId) || sectionId <= 0)) throw new ApiError(400, 'Invalid section id');
    if (hasSubsectionId && (!Number.isFinite(subsectionId) || subsectionId <= 0)) throw new ApiError(400, 'Invalid subsection id');

    if (hasSectionId) {
      const section = await this.repository.findCustomizationSectionById(sectionId);
      if (!section) throw new ApiError(404, 'Customization section not found');
    }

    if (hasSubsectionId) {
      const subsection = await this.repository.findCustomizationSubsectionById(subsectionId);
      if (!subsection) throw new ApiError(404, 'Customization subsection not found');
      if (hasSectionId && subsection.sectionId !== sectionId) {
        throw new ApiError(400, 'Selected subsection does not belong to selected section');
      }
    }

    try {
      const customizationRaw = await this.repository.updateCustomization(customizationId, {
        name,
        description: description || null,
        subsectionId: hasSubsectionId ? (subsectionId as number) : null,
      });

      return {
        message: 'Customization updated successfully',
        customization: normalizeCustomizationPayload(customizationRaw),
      };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new ApiError(404, 'Customization not found');
      throw error;
    }
  }

  async deleteCustomization(requesterIdRaw: unknown, customizationIdRaw: unknown) {
    await this.requireAdmin(requesterIdRaw, 'Forbidden: Only admins can delete customizations');

    const customizationId = parseInt(String(customizationIdRaw), 10);
    if (!Number.isFinite(customizationId)) throw new ApiError(400, 'Invalid customization id');

    try {
      await this.repository.deleteCustomization(customizationId);
      return { message: 'Customization deleted successfully' };
    } catch (error: any) {
      if (error?.code === 'P2025') throw new ApiError(404, 'Customization not found');
      throw error;
    }
  }
}
