import { ApiError } from '../services/apiError';
import { UsersService } from '../services/usersService';

export class UsersAdminController {
  constructor(private readonly usersService: UsersService) {}

  listUsers = async (req: any, res: any) => {
    try {
      const result = await this.usersService.listUsers(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Fetch users error:', error);
      return res.status(500).json({ error: 'Error fetching users' });
    }
  };

  exportUsers = async (req: any, res: any) => {
    try {
      const result = await this.usersService.exportUsers(req?.user?.id, req.query);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Export users error:', error);
      return res.status(500).json({ error: 'Error exporting users' });
    }
  };

  updateRole = async (req: any, res: any) => {
    try {
      const result = await this.usersService.updateUserRole(req?.user?.id, req.params.id, req.body?.role);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Update role error:', error);
      return res.status(500).json({ error: 'Error updating user role' });
    }
  };

  deleteUser = async (req: any, res: any) => {
    try {
      const result = await this.usersService.deleteUser(req?.user?.id, req.params.id);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Delete user error:', error);
      return res.status(500).json({ error: 'Error deleting user' });
    }
  };

  getAssignees = async (req: any, res: any) => {
    try {
      const result = await this.usersService.getAssignees();
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Get assignees error:', error);
      return res.status(500).json({ error: 'Error fetching assignees' });
    }
  };
}
