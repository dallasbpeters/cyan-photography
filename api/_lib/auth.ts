import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const BCRYPT_ROUNDS = 10;

export const hashPassword = (plain: string): string =>
  bcrypt.hashSync(plain, BCRYPT_ROUNDS);

export const verifyPassword = (plain: string, hash: string): boolean =>
  bcrypt.compareSync(plain, hash);

export const signToken = (payload: { sub: string; email: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error('JWT_SECRET must be set (minimum 16 characters)');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): { sub: string; email: string } | null => {
  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    return jwt.verify(token, secret) as { sub: string; email: string };
  } catch {
    return null;
  }
};

export const getBearerUser = (
  authHeader: string | undefined,
): { userId: string; email: string } | null => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const decoded = verifyToken(token);
  if (!decoded) return null;
  return { userId: decoded.sub, email: decoded.email };
};
