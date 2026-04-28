import { ApiError } from '../services/apiError';
import { AuthService } from '../services/authService';

export class AuthController {
  constructor(private readonly authService: AuthService) { }

  register = async (req: any, res: any) => {
    try {
      const result = await this.authService.register(req.body);
      return res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }

      console.error('Registration error:', error);
      return res.status(500).json({ error: 'Registration failed. Please check your credentials or try again later.' });
    }
  };

  login = async (req: any, res: any) => {

    try {
      const result = await this.authService.login(req.body);
      return res.status(200).json(result);
    } catch (error: any) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error during login' });
    }
  };
}
