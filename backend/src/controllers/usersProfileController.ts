import { ApiError } from '../services/apiError';
import { UsersService } from '../services/usersService';

export class UsersProfileController {
  constructor(private readonly usersService: UsersService) {}

  getUser = async (req: any, res: any) => {
    try {
      const user = await this.usersService.getUserProfile(req?.user?.id, req.params.id);
      return res.status(200).json(user);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(500).json({ error: 'Error fetching user: ' + error.message });
    }
  };

  updateUser = async (req: any, res: any) => {
    try {
      console.log('Updating user profile:', req.params.id);
      const result = await this.usersService.updateUserProfile(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      console.error('Update user profile error details:', {
        message: error.message,
        statusCode: error.statusCode,
        stack: error.stack,
        error
      });
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      return res.status(500).json({ error: 'Error updating user: ' + error.message });
    }
  };
}
