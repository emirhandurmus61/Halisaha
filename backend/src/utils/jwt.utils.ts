import jwt from 'jsonwebtoken';
import environment from '../config/environment';

interface TokenPayload {
  userId: string;
  email: string;
  userType: string;
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(
    payload,
    environment.jwt.secret,
    { expiresIn: environment.jwt.expiresIn } as jwt.SignOptions
  );
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, environment.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};
