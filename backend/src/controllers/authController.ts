import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { ApiError } from '../services/apiError';
import { AuthService } from '../services/authService';
import { getUserByEmail, verifyPassword, createUser } from '../models/userModel';

dotenv.config();

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ── Login ─────────────────────────────────────────────────────────────────

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate fields
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Try authService first
      try {
        const result = await this.authService.login(req.body);
        return res.status(200).json(result);
      } catch (serviceError: unknown) {
        if (serviceError instanceof ApiError) {
          return res.status(serviceError.statusCode).json({ error: serviceError.message });
        }
      }

      // Fallback — manual login
      const user = await getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (user.status !== 'active') {
        return res.status(403).json({ message: 'User is inactive' });
      }

      const isMatch = await verifyPassword(user, password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Build JWT
      const secret     = process.env.JWT_SECRET;
      const envExpires = process.env.JWT_EXPIRES_IN;

      if (!secret) throw new Error('JWT_SECRET is not defined');

      const expiresIn: SignOptions['expiresIn'] =
        envExpires && /^\d+$/.test(envExpires)
          ? Number(envExpires)
          : ((envExpires ?? '1h') as SignOptions['expiresIn']);

      const token = jwt.sign(
        { id: user.id, email: user.email, roleId: user.roleId },
        secret,
        { expiresIn } as any
      );

      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id:       user.id,
          fname:    user.fname,
          lname:    user.lname,
          email:    user.email,
          roleId:   user.roleId,
          roleName: user.roleName,
        },
      });

    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Login error:', error);
      return res.status(500).json({ error: 'Internal server error during login' });
    }
  };

  // ── Register ──────────────────────────────────────────────────────────────

  register = async (req: Request, res: Response) => {
    try {
      const { fname, lname, email, password, roleId, status } = req.body;

      // Validate fields
      if (!fname || !lname || !email || !password || !roleId || !status) {
        return res.status(400).json({ message: 'All fields are required' });
      }

      // Check if email already exists
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      // Try authService first
      try {
        const result = await this.authService.register(req.body);
        return res.status(201).json(result);
      } catch (serviceError: unknown) {
        if (serviceError instanceof ApiError) {
          return res.status(serviceError.statusCode).json({ error: serviceError.message });
        }
      }

      // Fallback — manual register
      const newUser = await createUser({
        fname,
        lname,
        email,
        password,
        roleId: Number(roleId),
        status,
      });

      return res.status(201).json({
        message: 'User created successfully',
        user: {
          id:     newUser.id,
          fname:  newUser.fname,
          lname:  newUser.lname,
          email:  newUser.email,
          roleId: newUser.roleId,
          status: newUser.status,
        },
      });

    } catch (error: unknown) {
      if (error instanceof ApiError) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      console.error('Registration error:', error);
      return res.status(500).json({
        error: 'Registration failed. Please check your credentials or try again later.',
      });
    }
  };
}