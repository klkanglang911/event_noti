import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import * as userModel from '../models/userModel.ts';
import type { User, LoginInput, LoginResponse, AuthUser } from '@event-noti/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// Login user
export async function login(input: LoginInput): Promise<LoginResponse | null> {
  const user = userModel.findByUsername(input.username);

  if (!user || !user.isActive) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

  const token = generateToken(user);

  // Remove passwordHash from user object
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
}

// Generate JWT token
export function generateToken(user: User | AuthUser): string {
  const payload: AuthUser = {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    return decoded;
  } catch {
    return null;
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
