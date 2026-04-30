import bcrypt from 'bcrypt';
import { UserRepository } from '../repositories/userRepository';

const userRepository = new UserRepository();

/**
 * Retrieves a user by their email.
 * Maps the database structure to the structure expected by the controller fallback.
 */
export const getUserByEmail = async (email: string) => {
  const user = await userRepository.findByEmail(email);
  if (!user) return null;

  // Split userName into fname and lname for the fallback
  const parts = user.userName ? user.userName.split(' ') : [''];
  const fname = parts[0] || '';
  const lname = parts.slice(1).join(' ') || '';

  return {
    id: user.userId,
    fname,
    lname,
    email: user.Email,
    password: user.password,
    roleId: user.role === 'ADMIN' ? 1 : 2,
    roleName: user.role,
    status: 'active', // Default status as database doesn't track status
  };
};

/**
 * Verifies a password against the hashed password.
 */
export const verifyPassword = async (user: any, password: string) => {
  if (!user || !user.password) return false;
  return await bcrypt.compare(password, user.password);
};

/**
 * Creates a new user in the database based on the fallback payload.
 */
export const createUser = async (data: {
  fname: string;
  lname: string;
  email: string;
  password: string;
  roleId: number;
  status: string;
}) => {
  const lastUser = await userRepository.findLastByIdDesc();
  const nextId = lastUser ? lastUser.userId + 1 : 1;
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const userName = `${data.fname || ''} ${data.lname || ''}`.trim();
  const role = data.roleId === 1 ? 'ADMIN' : 'NON_ADMIN';

  await userRepository.createUser({
    userId: nextId,
    userName,
    email: data.email,
    password: hashedPassword,
    contactNo: '', // Contact number is empty as it's not provided by the snippet
    role,
    img: '',
  });

  return {
    id: nextId,
    fname: data.fname,
    lname: data.lname,
    email: data.email,
    roleId: data.roleId,
    status: data.status,
  };
};
