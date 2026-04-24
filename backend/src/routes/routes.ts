import type { Express } from 'express';
import { UserRepository } from '../repositories/userRepository';
import { ManagementRepository } from '../repositories/managementRepository';
import { AuthService } from '../services/authService';
import { UsersService } from '../services/usersService';
import { ManagementService } from '../services/managementService';
import { AuthController } from '../controllers/authController';
import { UsersAdminController } from '../controllers/usersAdminController';
import { UsersProfileController } from '../controllers/usersProfileController';
import { ManagementQueryController } from '../controllers/managementQueryController';
import { ManagementAdminController } from '../controllers/managementAdminController';
import { buildAuthenticateMiddleware } from '../middleware/authenticate';

export const registerRoutes = (
  app: Express,
  prisma: any,
  pool: any,
  cloudinary: any,
  jwtSecret: string,
) => {
  const authenticate = buildAuthenticateMiddleware(jwtSecret);

  const userRepository = new UserRepository(prisma);
  const managementRepository = new ManagementRepository(prisma, pool);

  const authService = new AuthService(userRepository, jwtSecret);
  const usersService = new UsersService(userRepository, cloudinary);
  const managementService = new ManagementService(managementRepository);

  const authController = new AuthController(authService);
  const usersAdminController = new UsersAdminController(usersService);
  const usersProfileController = new UsersProfileController(usersService);
  const managementQueryController = new ManagementQueryController(managementService);
  const managementAdminController = new ManagementAdminController(managementService);

  app.post('/api/auth/register', authController.register);
  app.post('/api/auth/login', authController.login);

  app.get('/api/users', authenticate, usersAdminController.listUsers);
  app.get('/api/users/export', authenticate, usersAdminController.exportUsers);
  app.patch('/api/users/:id/role', authenticate, usersAdminController.updateRole);
  app.put('/api/users/:id', authenticate, usersProfileController.updateUser);
  app.delete('/api/users/:id', authenticate, usersAdminController.deleteUser);

  app.get('/api/companies', authenticate, managementQueryController.listCompanies);
  app.post('/api/companies', authenticate, managementAdminController.createCompany);
  app.put('/api/companies/:id', authenticate, managementAdminController.updateCompany);
  app.delete('/api/companies/:id', authenticate, managementAdminController.deleteCompany);

  app.get('/api/servers', authenticate, managementQueryController.listServers);
  app.post('/api/servers', authenticate, managementAdminController.createServer);
  app.put('/api/servers/:id', authenticate, managementAdminController.updateServer);

  app.get('/api/tenants', authenticate, managementQueryController.listTenants);
  app.post('/api/tenants', authenticate, managementAdminController.createTenant);
  app.put('/api/tenants/:id', authenticate, managementAdminController.updateTenant);

  app.get('/api/sip-configs', authenticate, managementQueryController.listSipConfigs);
  app.post('/api/sip-configs', authenticate, managementAdminController.createSipConfig);
  app.put('/api/sip-configs/:id', authenticate, managementAdminController.updateSipConfig);

  app.get('/api/customization-subsections', authenticate, managementQueryController.listCustomizationSubsections);
  app.get('/api/customization-sections', authenticate, managementQueryController.listCustomizationSections);
  app.post('/api/customization-subsections', authenticate, managementAdminController.createCustomizationSubsection);
  app.put('/api/customization-subsections/:id', authenticate, managementAdminController.updateCustomizationSubsection);
  app.delete('/api/customization-subsections/:id', authenticate, managementAdminController.deleteCustomizationSubsection);

  app.get('/api/customizations', authenticate, managementQueryController.listCustomizations);
  app.post('/api/customizations', authenticate, managementAdminController.createCustomization);
  app.put('/api/customizations/:id', authenticate, managementAdminController.updateCustomization);
  app.delete('/api/customizations/:id', authenticate, managementAdminController.deleteCustomization);
};