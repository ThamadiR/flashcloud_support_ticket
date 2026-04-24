import { ApiError } from '../services/apiError';
import { UsersService } from '../services/usersService';

export class UsersProfileController {
  constructor(private readonly usersService: UsersService) {}

  updateUser = async (req: any, res: any) => {
    try {
      const result = await this.usersService.updateUserProfile(req?.user?.id, req.params.id, req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Update user error:', error);
      return res.status(500).json({ error: 'Error updating user' });
    }
  };
}
