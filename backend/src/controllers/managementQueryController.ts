import { ApiError } from '../services/apiError';
import { ManagementService } from '../services/managementService';

export class ManagementQueryController {
  constructor(private readonly managementService: ManagementService) {}

  listCompanies = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listCompanies(req?.user?.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch companies error:', error);
      return res.status(500).json({ error: 'Error fetching companies' });
    }
  };

  listServers = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listServers(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch servers error:', error);
      return res.status(500).json({ error: 'Error fetching servers' });
    }
  };

  listTenants = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listTenants(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch tenants error:', error);
      return res.status(500).json({ error: 'Error fetching tenants' });
    }
  };

  listSipConfigs = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listSipConfigs(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch sip configs error:', error);
      return res.status(500).json({ error: 'Error fetching sip configs' });
    }
  };

  listCustomizationSubsections = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listCustomizationSubsections(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      const fs = require('fs');
      fs.appendFileSync('c:\\Users\\thama\\Documents\\GitHub\\flashcloud_support_ticket\\flashcloud_support_ticket\\backend\\error_log.txt', `[${new Date().toISOString()}] listCustomizationSubsections Error: ${error.stack || error}\n`);
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch customization subsections error:', error);
      return res.status(500).json({ error: 'Error fetching customization subsections' });
    }
  };

  listCustomizationSections = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listCustomizationSections(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      const fs = require('fs');
      fs.appendFileSync('c:\\Users\\thama\\Documents\\GitHub\\flashcloud_support_ticket\\flashcloud_support_ticket\\backend\\error_log.txt', `[${new Date().toISOString()}] listCustomizationSections Error: ${error.stack || error}\n`);
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch customization sections error:', error);
      return res.status(500).json({ error: 'Error fetching customization sections' });
    }
  };

  listCustomizations = async (req: any, res: any) => {
    try {
      const result = await this.managementService.listCustomizations(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      const fs = require('fs');
      fs.appendFileSync('c:\\Users\\thama\\Documents\\GitHub\\flashcloud_support_ticket\\flashcloud_support_ticket\\backend\\error_log.txt', `[${new Date().toISOString()}] listCustomizations Error: ${error.stack || error}\n`);
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Fetch customizations error:', error);
      return res.status(500).json({ error: 'Error fetching customizations' });
    }
  };
}
