import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface JWTPayload {
  userId: number;
  email: string;
  role: 'admin' | 'reception';
  type: 'access' | 'refresh';
}

const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_EXPIRY as SignOptions['expiresIn'],
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_EXPIRY as SignOptions['expiresIn'],
};

export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'access' }, env.JWT_ACCESS_SECRET, accessTokenOptions);
}

export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  return jwt.sign({ ...payload, type: 'refresh' }, env.JWT_REFRESH_SECRET, refreshTokenOptions);
}

export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

export function generateTokens(payload: Omit<JWTPayload, 'type'>) {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}