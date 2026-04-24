import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/userRepository';
import { ApiError } from './apiError';
import { normalizeImageUrl, resolveStoredRole, USER_ROLES } from './userHelpers';

export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtSecret: string,
  ) {}

  async register(payload: any) {
    const { username, email, password, confirmPassword, contactNo } = payload || {};

    if (!username || String(username).trim().length < 3) {
      throw new ApiError(400, 'Username must be at least 3 characters long');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email || !emailRegex.test(String(email))) {
      throw new ApiError(400, 'Please provide a valid @gmail.com address');
    }

    if (!password || String(password).length < 6) {
      throw new ApiError(400, 'Password must be at least 6 characters long');
    }

    if (String(password) !== String(confirmPassword)) {
      throw new ApiError(400, 'Passwords do not match');
    }

    const phoneRegex = /^\+[0-9]{1,4}[0-9]{9}$/;
    if (!contactNo || !phoneRegex.test(String(contactNo).trim())) {
      throw new ApiError(400, 'Contact number must include a valid country code and exactly 9 digits');
    }

    const existingUser = await this.userRepository.findByEmail(String(email));
    if (existingUser) {
      throw new ApiError(400, 'User already exists');
    }

    const lastUser = await this.userRepository.findLastByIdDesc();
    const nextId = lastUser ? lastUser.id + 1 : 1;

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newUser: any = await this.userRepository.createUser({
      id: nextId,
      username: String(username),
      email: String(email),
      password: hashedPassword,
      contactNo: String(contactNo).trim(),
      role: USER_ROLES.NON_ADMIN,
      img: null,
    });

    return {
      message: 'User registered successfully',
      userId: newUser.id,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        contactNo: newUser.contactNo,
        role: resolveStoredRole(newUser),
        img: newUser.img,
        avatarUrl: newUser.img,
      },
    };
  }

  async login(payload: any) {
    const { email, password } = payload || {};

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!email || !emailRegex.test(String(email))) {
      throw new ApiError(400, 'Please provide a valid @gmail.com address');
    }

    if (!password) {
      throw new ApiError(400, 'Password must not be empty');
    }

    const user: any = await this.userRepository.findByEmail(String(email));
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = jwt.sign({ id: user.id }, this.jwtSecret, { expiresIn: '1d' });
    const safeImg = normalizeImageUrl(user.img) || null;

    return {
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: resolveStoredRole(user),
        img: safeImg,
        avatarUrl: safeImg,
      },
    };
  }
}
