import { ApiError } from '../services/apiError';
import { ManagementService } from '../services/managementService';

export class ManagementAdminController {
  constructor(private readonly managementService: ManagementService) { }

  createCompany = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createCompany(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create company error:', error);
      return res.status(500).json({ error: 'Error creating company' });
    }
  };

  updateCompany = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateCompany(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update company error:', error);
      return res.status(500).json({ error: 'Error updating company' });
    }
  };

  deleteCompany = async (req: any, res: any) => {
    try {
      const result = await this.managementService.deleteCompany(req?.user?.id, req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Delete company error:', error);
      return res.status(500).json({ error: 'Error deleting company' });
    }
  };

  createServer = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createServer(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create server error:', error);
      return res.status(500).json({ error: 'Error creating server' });
    }
  };

  updateServer = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateServer(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update server error:', error);
      return res.status(500).json({ error: 'Error updating server' });
    }
  };

  deleteServer = async (req: any, res: any) => {
    try {
      const result = await this.managementService.deleteServer(req?.user?.id, req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Delete server error:', error);
      return res.status(500).json({ error: 'Error deleting server' });
    }
  };

  createTenant = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createTenant(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create tenant error:', error);
      return res.status(500).json({ error: 'Error creating tenant' });
    }
  };

  updateTenant = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateTenant(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update tenant error:', error);
      return res.status(500).json({ error: 'Error updating tenant' });
    }
  };

  createSipConfig = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createSipConfig(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create sip config error:', error);
      return res.status(500).json({ error: 'Error creating sip configuration' });
    }
  };

  updateSipConfig = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateSipConfig(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update sip config error:', error);
      return res.status(500).json({ error: 'Error updating sip configuration' });
    }
  };

  createCustomizationSubsection = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createCustomizationSubsection(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create customization subsection error:', error);
      return res.status(500).json({ error: 'Error creating customization subsection' });
    }
  };

  updateCustomizationSubsection = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateCustomizationSubsection(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update customization subsection error:', error);
      return res.status(500).json({ error: 'Error updating customization subsection' });
    }
  };

  deleteCustomizationSubsection = async (req: any, res: any) => {
    try {
      const result = await this.managementService.deleteCustomizationSubsection(req?.user?.id, req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Delete customization subsection error:', error);
      return res.status(500).json({ error: 'Error deleting customization subsection' });
    }
  };

  createCustomization = async (req: any, res: any) => {
    try {
      const result = await this.managementService.createCustomization(req?.user?.id, req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Create customization error:', error);
      return res.status(500).json({ error: 'Error creating customization' });
    }
  };

  updateCustomization = async (req: any, res: any) => {
    try {
      const result = await this.managementService.updateCustomization(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Update customization error:', error);
      return res.status(500).json({ error: 'Error updating customization' });
    }
  };

  deleteCustomization = async (req: any, res: any) => {
    try {
      const result = await this.managementService.deleteCustomization(req?.user?.id, req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) return res.status(error.statusCode).json({ error: error.message });
      console.error('Delete customization error:', error);
      return res.status(500).json({ error: 'Error deleting customization' });
    }
  };
}
